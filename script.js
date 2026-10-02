import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

// Cấu hình Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAc1N9X4y3G-qCnp2dt3DCkFpa1Kc7Wctc",
    projectId: "baitap-e5015"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let danhSachCauHoi = []; // Mảng chứa các câu hỏi

// Kiểm tra URL
const urlParams = new URLSearchParams(window.location.search);
const quizId = urlParams.get('id');

if (quizId) {
    document.getElementById('quiz-panel').style.display = 'block';
    loadQuiz(quizId);
} else {
    document.getElementById('admin-panel').style.display = 'block';
}

// ---------------- PHẦN MỚI THÊM: Ẩn/Hiện nhóm nhập liệu ----------------
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
// ------------------------------------------------------------------------

// Xử lý nút Thêm câu hỏi
document.getElementById('btn-add').addEventListener('click', () => {
    const questionText = document.getElementById('question').value;
    const type = document.getElementById('question-type').value; // Lấy loại câu hỏi

    if (!questionText) {
        alert("Vui lòng nhập câu hỏi!");
        return;
    }

    // Phân loại khi lưu dữ liệu
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
            type: type, // "tra-loi-ngan" hoặc "tu-luan"
            question: questionText,
            answerKey: document.getElementById('answer-key').value
        });
    }
    
    // Xóa trắng ô nhập
    document.getElementById('question').value = '';
    document.getElementById('opt-a').value = '';
    document.getElementById('exp-a').value = '';
    document.getElementById('opt-b').value = '';
    document.getElementById('exp-b').value = '';
    document.getElementById('answer-key').value = '';
    
    alert(`Đã lưu tạm câu ${danhSachCauHoi.length}. Hãy nhập đề câu tiếp theo!`);
});

// Xử lý nút Lưu và tạo Link
document.getElementById('btn-save').addEventListener('click', async () => {
    if (document.getElementById('question').value.trim() !== "") {
        document.getElementById('btn-add').click();
    }

    if (danhSachCauHoi.length === 0) {
        alert("Chưa có câu hỏi nào!");
        return;
    }

    const docRef = await addDoc(collection(db, "quizzes"), { danhSach: danhSachCauHoi });
    
    const baseUrl = window.location.origin + window.location.pathname;
    const link = `${baseUrl}?id=${docRef.id}`;
    document.getElementById('link-result').innerHTML = `Link của bạn: <a href="${link}" style="color:#8ab4f8" target="_blank">${link}</a>`;
});

// Hàm tải dữ liệu khi có người truy cập link
async function loadQuiz(id) {
    const docSnap = await getDoc(doc(db, "quizzes", id));
    if (docSnap.exists()) {
        const data = docSnap.data();
        let html = '';
        
        data.danhSach.forEach((cauHoi, index) => {
            html += `<div class="card" style="margin-top: 20px; border-left: 4px solid #8ab4f8;">
                        <strong>Câu ${index + 1}:</strong> ${cauHoi.question}
                     </div>`;
            
            // Phân loại khi hiển thị ra cho người làm bài
            if (!cauHoi.type || cauHoi.type === 'trac-nghiem') {
                // Render trắc nghiệm
                cauHoi.options.forEach((opt, i) => {
                    const letter = String.fromCharCode(65 + i); 
                    html += `
                        <div class="card option" onclick="this.classList.toggle('active')">
                            <strong>${letter}.</strong> ${opt.text}
                            <div class="explanation">${opt.exp}</div>
                        </div>`;
                });
            } else {
                // Render ô tự luận / trả lời ngắn + Nút xem đáp án
                html += `
                    <textarea placeholder="Nhập câu trả lời của bạn vào đây..."></textarea>
                    <div class="card option" onclick="this.classList.toggle('active')" style="margin-top: 10px; background-color: #202124;">
                        <strong>👁️ Bấm vào đây để xem đáp án gốc</strong>
                        <div class="explanation">${cauHoi.answerKey}</div>
                    </div>`;
            }
        });
        
        const container = document.getElementById('quiz-content');
        container.innerHTML = html;
        
        if (typeof renderMathInElement === "function") {
            renderMathInElement(container, { delimiters: [{left: "$$", right: "$$", display: false}] });
        }
    } else {
        document.getElementById('quiz-content').innerHTML = "Không tìm thấy đề bài!";
    }
}
