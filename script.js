import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

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

let danhSachCauHoi = [];
let quizDataGlobal = [];
let currentQuestionIndex = 0;

const urlParams = new URLSearchParams(window.location.search);
const quizId = urlParams.get('id');

if (quizId) {
    document.getElementById('quiz-panel').style.display = 'block';
    loadQuiz(quizId);
} else {
    document.getElementById('admin-panel').style.display = 'block';
}

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

document.getElementById('btn-add').addEventListener('click', () => {
    const questionText = document.getElementById('question').value.trim();
    const type = document.getElementById('question-type').value;

    if (!questionText) {
        alert("Vui lòng nhập câu hỏi!");
        return;
    }

    if (type === 'trac-nghiem') {
        const correctIndex = parseInt(document.querySelector('input[name="correct-answer"]:checked').value);
        
        danhSachCauHoi.push({
            type: "trac-nghiem",
            question: questionText,
            options: [
                { text: document.getElementById('opt-a').value, exp: document.getElementById('exp-a').value, isCorrect: correctIndex === 0 },
                { text: document.getElementById('opt-b').value, exp: document.getElementById('exp-b').value, isCorrect: correctIndex === 1 },
                { text: document.getElementById('opt-c').value, exp: document.getElementById('exp-c').value, isCorrect: correctIndex === 2 },
                { text: document.getElementById('opt-d').value, exp: document.getElementById('exp-d').value, isCorrect: correctIndex === 3 }
            ]
        });
    } else {
        danhSachCauHoi.push({
            type: type,
            question: questionText,
            answerKey: document.getElementById('answer-key').value
        });
    }
    
    // Xóa trắng form
    document.getElementById('question').value = '';
    ['a', 'b', 'c', 'd'].forEach(id => {
        if(document.getElementById(`opt-${id}`)) document.getElementById(`opt-${id}`).value = '';
        if(document.getElementById(`exp-${id}`)) document.getElementById(`exp-${id}`).value = '';
    });
    if(document.getElementById('answer-key')) document.getElementById('answer-key').value = '';
    if(document.querySelector('input[name="correct-answer"][value="0"]')) document.querySelector('input[name="correct-answer"][value="0"]').checked = true;
    
    alert(`Đã thêm xong! Đang có ${danhSachCauHoi.length} câu hỏi.`);
});

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
        alert("Lỗi khi kết nối Firebase: " + error.message);
    } finally {
        saveBtn.innerText = "Lưu và tạo Link";
        saveBtn.disabled = false;
    }
});

async function loadQuiz(id) {
    try {
        const docSnap = await getDoc(doc(db, "quizzes", id));
        if (docSnap.exists()) {
            quizDataGlobal = docSnap.data().danhSach;
            currentQuestionIndex = 0;
            renderCurrentQuestion();
        } else {
            document.getElementById('quiz-content').innerHTML = "Không tìm thấy đề bài!";
        }
    } catch (err) {
        document.getElementById('quiz-content').innerHTML = "Lỗi tải đề: " + err.message;
    }
}

function renderCurrentQuestion() {
    const container = document.getElementById('quiz-content');

    if (currentQuestionIndex >= quizDataGlobal.length) {
        container.innerHTML = `<div class="card" style="text-align: center; border-left: 4px solid #4caf50;">
                                    <h2>🎉 Chúc mừng! Bạn đã hoàn thành bài làm.</h2>
                               </div>`;
        return;
    }

    const cauHoi = quizDataGlobal[currentQuestionIndex];
    
    let html = `<div class="card" style="margin-top: 20px; border-left: 4px solid #8ab4f8;">
                    <strong>Câu ${currentQuestionIndex + 1} / ${quizDataGlobal.length}:</strong> ${cauHoi.question}
                </div>`;
    
    if (!cauHoi.type || cauHoi.type === 'trac-nghiem') {
        cauHoi.options.forEach((opt, i) => {
            const letter = String.fromCharCode(65 + i); 
            html += `
                <div class="card option trac-nghiem-opt">
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

    html += `<button id="btn-next" style="margin-top: 15px; width: 100%; padding: 14px; font-size: 16px;">Xác nhận nộp & Chuyển câu tiếp theo</button>`;
    container.innerHTML = html;

    if (typeof renderMathInElement === "function") {
        renderMathInElement(container, { delimiters: [{left: "$$", right: "$$", display: false}] });
    }

    // --- LOGIC CHẤM ĐIỂM TRẮC NGHIỆM TẠI CHỖ ---
    if (!cauHoi.type || cauHoi.type === 'trac-nghiem') {
        const optionEls = container.querySelectorAll('.trac-nghiem-opt');
        let answered = false; 
        
        optionEls.forEach((el, i) => {
            el.addEventListener('click', function() {
                if (answered) return; 
                answered = true;
                
                this.classList.add('active'); 
                
                if (cauHoi.options[i].isCorrect) {
                    this.style.borderColor = '#4caf50';
                    this.innerHTML = "✅ " + this.innerHTML;
                } else {
                    this.style.borderColor = '#f44336';
                    this.innerHTML = "❌ " + this.innerHTML;
                    
                    optionEls.forEach((optEl, optIndex) => {
                        if (cauHoi.options[optIndex].isCorrect) {
                            optEl.style.borderColor = '#4caf50';
                            optEl.classList.add('active');
                        }
                    });
                }
            });
        });
    }

    // --- LOGIC CHUYỂN CÂU ---
    document.getElementById('btn-next').addEventListener('click', () => {
        currentQuestionIndex++;
        renderCurrentQuestion(); 
    });
}
