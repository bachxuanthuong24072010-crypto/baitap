import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

// Cấu hình Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAc1N9X4y3G-qCnp2dt3DCkFpa1Kc7Wctc",
    authDomain: "baitap-e5015.firebaseapp.com",
    projectId: "baitap-e5015",
    storageBucket: "baitap-e5015.firebasestorage.app",
    messagingSenderId: "64640568211",
    appId: "1:64640568211:web:4b4946825298603779b666"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let danhSachCauHoi = [];      // Mảng khi tạo câu hỏi
let quizDataGlobal = [];      // Mảng chứa đề bài khi làm bài
let currentQuestionIndex = 0; // Theo dõi đang ở câu số mấy

// Kiểm tra URL
const urlParams = new URLSearchParams(window.location.search);
const quizId = urlParams.get('id');

if (quizId) {
    document.getElementById('quiz-panel').style.display = 'block';
    loadQuiz(quizId);
} else {
    document.getElementById('admin-panel').style.display = 'block';
}

// Ẩn/Hiện nhóm nhập liệu
const questionType = document.getElementById('question-type');
if (questionType) {
    questionType.addEventListener('change', function() {
        if (this.value === 'trac-nghiem') {
            document.getElementById('trac-nghiem-group').style.display = 'block';
            document.getElementById('tu-luan-group').style.display = 'none';
        } else {
            document.getElementById('trac-nghiem-group').style.display = 'none';
            document.getElementById('tu-luan-group').style.display = 'block';
        }
    });
}

// Nút Thêm câu hỏi
document.getElementById('btn-add').addEventListener('click', () => {
    const questionText = document.getElementById('question').value.trim();
    const type = document.getElementById('question-type').value;

    if (!questionText) {
        alert("Vui lòng nhập câu hỏi!");
        return;
    }

    if (type === 'trac-nghiem') {
        danhSachCauHoi.push({
            type: "trac-nghiem",
            question: questionText,
            options: [
                { text: document.getElementById('opt-a').value, exp: document.getElementById('exp-a').value },
                { text: document.getElementById('opt-b').value, exp: document.getElementById('exp-b').value }
            ]
        });
    } else {
        danhSachCauHoi.push({
            type: type,
            question: questionText,
            answerKey: document.getElementById('answer-key').value
        });
    }
    
    document.getElementById('question').value = '';
    document.getElementById('opt-a').value = '';
    document.getElementById('exp-a').value = '';
    document.getElementById('opt-b').value = '';
    document.getElementById('exp-b').value = '';
    document.getElementById('answer-key').value = '';
    
    alert(`Đã thêm xong! Đang có ${danhSachCauHoi.length} câu hỏi.`);
});

// Nút Lưu và tạo Link
document.getElementById('btn-save').addEventListener('click', async () => {
    const currentQuestion = document.getElementById('question').value.trim();
    if (currentQuestion !== "") {
        document.getElementById('btn-add').click();
    }

    if (danhSachCauHoi.length === 0) {
        alert("Chưa có câu hỏi nào để tạo link!");
        return;
    }

    const saveBtn = document.getElementById('btn-save');
    saveBtn.innerText = "Đang tạo link...";
    saveBtn.disabled = true;

    try {
        const docRef = await addDoc(collection(db, "quizzes"), { danhSach: danhSachCauHoi });
        const baseUrl = window.location.origin + window.location.pathname;
        const link = `${baseUrl}?id=${docRef.id}`;
        
        document.getElementById('link-result').innerHTML = `
            <b>Link bài tập của bạn:</b><br>
            <a href="${link}" style="color:#8ab4f8; word-break: break-all;" target="_blank">${link}</a>
        `;
        alert("Tạo link thành công!");
    } catch (error) {
        console.error("Lỗi chi tiết:", error);
        alert("Lỗi khi kết nối Firebase: " + error.message);
    } finally {
        saveBtn.innerText = "Lưu và tạo Link";
        saveBtn.disabled = false;
    }
});

// ---------------- PHẦN MỚI THAY ĐỔI: HIỂN THỊ TỪNG CÂU ----------------
async function loadQuiz(id) {
    try {
        const docSnap = await getDoc(doc(db, "quizzes", id));
        if (docSnap.exists()) {
            quizDataGlobal = docSnap.data().danhSach;
            currentQuestionIndex = 0; // Bắt đầu từ câu đầu tiên
            renderCurrentQuestion();
        } else {
            document.getElementById('quiz-content').innerHTML = "Không tìm thấy đề bài!";
        }
    } catch (err) {
        document.getElementById('quiz-content').innerHTML = "Lỗi tải đề: " + err.message;
    }
}

// Hàm vẽ đúng 1 câu hỏi lên màn hình
function renderCurrentQuestion() {
    const container = document.getElementById('quiz-content');

    // Nếu đã làm hết câu hỏi -> Hiện thông báo hoàn thành
    if (currentQuestionIndex >= quizDataGlobal.length) {
        container.innerHTML = `<div class="card" style="text-align: center; border-left: 4px solid #4caf50;">
                                    <h2>🎉 Chúc mừng! Bạn đã hoàn thành bài làm.</h2>
                               </div>`;
        return;
    }

    // Lấy câu hỏi hiện tại
    const cauHoi = quizDataGlobal[currentQuestionIndex];
    
    let html = `<div class="card" style="margin-top: 20px; border-left: 4px solid #8ab4f8;">
                    <strong>Câu ${currentQuestionIndex + 1} / ${quizDataGlobal.length}:</strong> ${cauHoi.question}
                </div>`;
    
    if (!cauHoi.type || cauHoi.type === 'trac-nghiem') {
        cauHoi.options.forEach((opt, i) => {
            const letter = String.fromCharCode(65 + i); 
            html += `
                <div class="card option" onclick="this.classList.toggle('active')">
                    <strong>${letter}.</strong> ${opt.text}
                    <div class="explanation">${opt.exp}</div>
                </div>`;
        });
    } else {
        html += `
            <textarea class="user-answer" placeholder="Nhập câu trả lời của bạn vào đây..."></textarea>
            <div class="card option" onclick="this.classList.toggle('active')" style="margin-top: 10px; background-color: #202124;">
                <strong>👁️ Bấm vào đây để xem đáp án gốc</strong>
                <div class="explanation">${cauHoi.answerKey}</div>
            </div>`;
    }

    // Nút Nộp & Chuyển câu tiếp theo
    html += `<button id="btn-next" style="margin-top: 15px; width: 100%; padding: 14px; font-size: 16px;">Xác nhận nộp & Chuyển câu tiếp theo</button>`;

    container.innerHTML = html;

    // Render công thức Toán/Hóa
    if (typeof renderMathInElement === "function") {
        renderMathInElement(container, { delimiters: [{left: "$$", right: "$$", display: false}] });
    }

    // Sự kiện khi bấm nút Chuyển câu
    document.getElementById('btn-next').addEventListener('click', () => {
        currentQuestionIndex++;
        renderCurrentQuestion(); // Load lại giao diện với câu mới
    });
}
