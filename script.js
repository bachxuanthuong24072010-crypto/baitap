import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

// Cấu hình Firebase
const firebaseConfig = {
    apiKey: "NHAP_CUA_BAN",
    projectId: "NHAP_CUA_BAN"
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

// Xử lý nút Thêm câu hỏi
document.getElementById('btn-add').addEventListener('click', () => {
    const questionText = document.getElementById('question').value;
    if (!questionText) {
        alert("Vui lòng nhập câu hỏi!");
        return;
    }

    danhSachCauHoi.push({
        question: questionText,
        options: [
            { text: document.getElementById('opt-a').value, exp: document.getElementById('exp-a').value },
            { text: document.getElementById('opt-b').value, exp: document.getElementById('exp-b').value }
        ]
    });
    
    // Xóa trắng ô nhập
    document.getElementById('question').value = '';
    document.getElementById('opt-a').value = '';
    document.getElementById('exp-a').value = '';
    document.getElementById('opt-b').value = '';
    document.getElementById('exp-b').value = '';
    
    alert(`Đã lưu tạm câu ${danhSachCauHoi.length}. Hãy nhập đề câu tiếp theo!`);
});

// Xử lý nút Lưu và tạo Link
document.getElementById('btn-save').addEventListener('click', async () => {
    // Nếu đang gõ dở mà quên bấm thêm, tự động thêm vào
    if (document.getElementById('question').value.trim() !== "") {
        document.getElementById('btn-add').click();
    }

    if (danhSachCauHoi.length === 0) {
        alert("Chưa có câu hỏi nào!");
        return;
    }

    // Đẩy cả mảng lên Firebase
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
        
        // Duyệt qua mảng để in ra tất cả câu hỏi
        data.danhSach.forEach((cauHoi, index) => {
            html += `<div class="card" style="margin-top: 20px; border-left: 4px solid #8ab4f8;">
                        <strong>Câu ${index + 1}:</strong> ${cauHoi.question}
                     </div>`;
            
            cauHoi.options.forEach((opt, i) => {
                const letter = String.fromCharCode(65 + i); // A, B
                html += `
                    <div class="card option" onclick="this.classList.toggle('active')">
                        <strong>${letter}.</strong> ${opt.text}
                        <div class="explanation">${opt.exp}</div>
                    </div>`;
            });
        });
        
        const container = document.getElementById('quiz-content');
        container.innerHTML = html;
        
        // Render công thức
        if (typeof renderMathInElement === "function") {
            renderMathInElement(container, { delimiters: [{left: "$$", right: "$$", display: false}] });
        }
    } else {
        document.getElementById('quiz-content').innerHTML = "Không tìm thấy đề bài!";
    }
}