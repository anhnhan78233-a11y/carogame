// Sử dụng Server Socket công khai miễn phí (Peer2Peer relay)
const socket = io("https://pie-socket.com", {
  transports: ["websocket"]
});

let roomId = "";
let mySymbol = "";
let isMyTurn = false;
let boardState = Array(15).fill(null).map(() => Array(15).fill(null));

const statusDiv = document.getElementById('status');
const boardDiv = document.getElementById('board');

// Hiệu ứng Sakura
for (let i = 0; i < 20; i++) {
  const petal = document.createElement('div');
  petal.classList.add('sakura');
  petal.style.width = Math.random() * 8 + 8 + 'px';
  petal.style.height = Math.random() * 8 + 8 + 'px';
  petal.style.left = Math.random() * 100 + 'vw';
  petal.style.animationDuration = Math.random() * 3 + 4 + 's';
  petal.style.animationDelay = Math.random() * 5 + 's';
  document.body.appendChild(petal);
}

// Bàn cờ 15x15
function createBoard() {
  boardDiv.innerHTML = '';
  boardState = Array(15).fill(null).map(() => Array(15).fill(null));
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.addEventListener('click', () => handleMove(r, c, cell));
      boardDiv.appendChild(cell);
    }
  }
}

function joinRoom() {
  const input = document.getElementById('roomIdInput').value.trim();
  if (!input) return alert("Vui lòng nhập mã phòng!");
  
  roomId = "caro_room_" + input;
  createBoard();
  
  // Phát tín hiệu tham gia room qua Socket
  socket.emit("subscribe", { channel: roomId });
  statusDiv.innerText = `Đã vào phòng [${input}]. Đang kết nối đối thủ...`;
}

function handleMove(r, c, cell) {
  if (!isMyTurn || boardState[r][c] !== null) return;

  boardState[r][c] = mySymbol;
  cell.innerText = mySymbol;
  cell.classList.add(mySymbol === 'X' ? 'x-symbol' : 'o-symbol');
  
  isMyTurn = false;
  statusDiv.innerText = "Đã đánh! Đang chờ đối thủ...";

  // Gửi nước đi qua Socket
  socket.emit("send_message", {
    channel: roomId,
    data: { row: r, col: c, symbol: mySymbol }
  });
}

// Nhận dữ liệu từ đối thủ qua Socket
socket.on("message", (msg) => {
  if (!msg || !msg.data) return;
  const { row, col, symbol } = msg.data;

  // Tự động phân chia X/O nếu chưa chọn
  if (!mySymbol) {
    mySymbol = 'O';
  }

  if (symbol !== mySymbol) {
    boardState[row][col] = symbol;
    const index = row * 15 + col;
    const cell = boardDiv.children[index];
    cell.innerText = symbol;
    cell.classList.add(symbol === 'X' ? 'x-symbol' : 'o-symbol');
    
    isMyTurn = true;
    statusDiv.innerText = "Đến lượt bạn!";
  }
});

// Xác nhận quyền đi trước nếu là người bấm vào phòng trước
document.getElementById('roomIdInput').addEventListener('change', () => {
  mySymbol = 'X';
  isMyTurn = true;
});