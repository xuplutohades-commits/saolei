const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const newGameBtn = document.getElementById('new-game');
const revealAllBtn = document.getElementById('reveal-all');
const rowsInput = document.getElementById('rows');
const colsInput = document.getElementById('cols');
const minesInput = document.getElementById('mines');

let rows = 10, cols = 10, mines = 15;
let grid = [];
let gameOver = false;
let openedCount = 0;
let flagMode = false;

const statusPrefix = (text)=>`状态：${text}`;

function showStatus(text, level = 'normal'){
  statusEl.textContent = text;
  statusEl.className = 'status';
  if(level === 'success') statusEl.classList.add('success');
  else if(level === 'fail') statusEl.classList.add('fail');
}

function init(){
  rows = Math.max(5, Math.min(30, parseInt(rowsInput.value)||10));
  cols = Math.max(5, Math.min(30, parseInt(colsInput.value)||10));
  const maxMines = Math.floor(rows*cols*0.6);
  mines = Math.max(1, Math.min(maxMines, parseInt(minesInput.value)||15));
  minesInput.value = mines;
  grid = Array(rows).fill(null).map(()=>Array(cols).fill(null));
  gameOver = false;
  openedCount = 0;
  flagMode = false;
  updateFlagModeUI();

  boardEl.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
  boardEl.innerHTML = '';

  for(let i=0;i<rows;i++){
    for(let j=0;j<cols;j++){
      const cell={row:i,col:j,isMine:false,opened:false,flagged:false,value:0};
      grid[i][j]=cell;
      const el = document.createElement('div');
      el.className='cell';
      el.dataset.row=i;
      el.dataset.col=j;
      el.addEventListener('click', clickCell);
      boardEl.appendChild(el);
      cell.el=el;
    }
  }

  placeMines();
  computeNumbers();
  showStatus('游戏进行中，勇敢扫雷！F键切换左键标雷模式。');
}

function placeMines(){
  let placed=0;
  while(placed<mines){
    const r=Math.floor(Math.random()*rows);
    const c=Math.floor(Math.random()*cols);
    if(grid[r][c].isMine) continue;
    grid[r][c].isMine=true;
    placed++;
  }
}

function computeNumbers(){
  const dirs=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  for(let i=0;i<rows;i++) for(let j=0;j<cols;j++){
    if(grid[i][j].isMine){ grid[i][j].value=0; continue; }
    let cnt=0;
    for(const [dr,dc] of dirs){
      const nr=i+dr, nc=j+dc;
      if(nr>=0 && nr<rows && nc>=0 && nc<cols && grid[nr][nc].isMine) cnt++;
    }
    grid[i][j].value=cnt;
  }
}

function clickCell(event){
  if(gameOver) return;
  const r=+this.dataset.row;
  const c=+this.dataset.col;
  const cell=grid[r][c];
  if(cell.opened) return;

  if(flagMode){
    toggleFlag(cell);
    return;
  }

  if(cell.flagged) return;

  if(cell.isMine){
    revealAll(false);
    gameOver=true;
    showStatus('真遗憾，再来一次吧', 'fail');
    return;
  }

  openCell(cell);

  if(openedCount === rows*cols - mines){
    gameOver=true;
    showStatus('你成功了！', 'success');
    revealAll(true);
  }
}

function toggleFlag(cell){
  if(cell.opened) return;
  cell.flagged=!cell.flagged;
  cell.el.classList.toggle('flag', cell.flagged);
  cell.el.textContent = cell.flagged ? '🚩' : '';
}

function openCell(cell){
  if(cell.opened || cell.flagged) return;
  cell.opened=true;
  openedCount++;
  cell.el.classList.add('open');
  if(cell.isMine){
    cell.el.classList.add('mine');
    cell.el.textContent='💣';
    return;
  }
  if(cell.value>0){
    cell.el.textContent=cell.value;
    cell.el.dataset.value=cell.value;
  } else {
    cell.el.textContent='';
    floodFill(cell.row, cell.col);
  }
}

function floodFill(r,c){
  const dirs=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  for(const [dr,dc] of dirs){
    const nr=r+dr, nc=c+dc;
    if(nr<0||nr>=rows||nc<0||nc>=cols) continue;
    const adj=grid[nr][nc];
    if(adj.opened || adj.flagged || adj.isMine) continue;
    adj.opened=true;
    openedCount++;
    adj.el.classList.add('open');
    if(adj.value>0){
      adj.el.textContent=adj.value;
      adj.el.dataset.value=adj.value;
    } else {
      adj.el.textContent='';
      floodFill(nr,nc);
    }
  }
}

function revealAll(win){
  for(let i=0;i<rows;i++) for(let j=0;j<cols;j++){
    const cell=grid[i][j];
    if(cell.opened) continue;
    cell.opened=true;
    cell.el.classList.add('open');
    if(cell.isMine){
      cell.el.classList.add('mine');
      cell.el.textContent = win ? '💣' : (cell.flagged ? '🚩' : '💣');
      continue;
    }
    if(cell.value>0){
      cell.el.textContent=cell.value;
      cell.el.dataset.value=cell.value;
    } else {
      cell.el.textContent='';
    }
    if(cell.flagged && !cell.isMine){
      cell.el.style.opacity='0.6';
      cell.el.textContent='❌';
    }
  }
}

function updateFlagModeUI(){
  let fm = document.querySelector('.flag-mode');
  if(!fm){
    fm = document.createElement('span'); fm.className='flag-mode';
    document.querySelector('.controls').appendChild(fm);
  }
  fm.textContent = flagMode ? '标雷模式：开启' : '标雷模式：关闭';
  fm.classList.toggle('active', flagMode);
}

newGameBtn.addEventListener('click', init);
revealAllBtn.addEventListener('click', ()=>{revealAll(false); gameOver=true; showStatus('已揭开全部，点击“新游戏”继续。');});
window.addEventListener('keydown', (e)=>{
  if(e.key==='f' || e.key==='F'){
    flagMode=!flagMode;
    updateFlagModeUI();
    showStatus(flagMode ? '进入标雷模式：左键改变旗子状态' : '退出标雷模式：左键打开');
  }
});

init();
