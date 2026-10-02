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

// Gắn mảng vào window để HTML có thể gọi lệnh onchange chỉnh sửa trực tiếp
window.danhSachCauHoi = [];
let quizDataGlobal = [];
let currentQuestionIndex = 0;
let score = 0; 

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
        document.getElementById('trac-nghiem-group').style.display = 'none';
        document.getElementById('dung-sai-group').style.display = 'none';
        document.getElementById('tu-luan-group').style.display = 'none';

        if (this.value === 'trac-nghiem') document.getElementById('trac-nghiem-group').style.display = 'block';
        else if (this.value === 'dung-sai') document.getElementById('dung-sai-group').style.display = 'block';
        else document.getElementById('tu-luan-group').style.display = 'block';
    });
}

// Xử lý thêm câu hỏi thủ công
document.getElementById('btn-add').addEventListener('click', () => {
    const questionText = document.getElementById('question').value.trim();
    const type = document.getElementById('question-type').value;

    if (!questionText) {
        alert("Vui lòng nhập câu hỏi!");
        return;
    }

    if (type === 'trac-nghiem') {
        const correctIndex = parseInt(document.querySelector('input[name="correct-answer"]:checked').value);
        window.danhSachCauHoi.push({
            type: "trac-nghiem",
            question: questionText,
            options: [
                { text: document.getElementById('opt-a').value, exp: document.getElementById('exp-a').value, isCorrect: correctIndex === 0 },
                { text: document.getElementById('opt-b').value, exp: document.getElementById('exp-b').value, isCorrect: correctIndex === 1 },
                { text: document.getElementById('opt-c').value, exp: document.getElementById('exp-c').value, isCorrect: correctIndex === 2 },
                { text: document.getElementById('opt-d').value, exp: document.getElementById('exp-d').value, isCorrect: correctIndex === 3 }
            ]
        });
    } else if (type === 'dung-sai') {
        const tfCorrectIndex = parseInt(document.querySelector('input[name="tf-correct"]:checked').value);
        window.danhSachCauHoi.push({
            type: "trac-nghiem",
            question: questionText,
            options: [
                { text: "ĐÚNG", exp: document.getElementById('exp-tf-true').value, isCorrect: tfCorrectIndex === 0 },
                { text: "SAI", exp: document.getElementById('exp-tf-false').value, isCorrect: tfCorrectIndex === 1 }
            ]
        });
    } else {
        window.danhSachCauHoi.push({
            type: type,
            question: questionText,
            answerKey: document.getElementById('answer-key').value
        });
    }
    
    document.getElementById('question').value = '';
    ['a', 'b', 'c', 'd'].forEach(id => {
        if(document.getElementById(`opt-${id}`)) document.getElementById(`opt-${id}`).value = '';
        if(document.getElementById(`exp-${id}`)) document.getElementById(`exp-${id}`).value = '';
    });
    renderPreview(); // Cập nhật lại khung xem trước
    alert(`Đã thêm! Hiện có ${window.danhSachCauHoi.length} câu.`);
});

// Xử lý Bóc tách & Xem trước
document.getElementById('btn-preview').addEventListener('click', () => {
    const textRaw = document.getElementById('bulk-input').value;
    if(!textRaw.trim()) return alert("Vui lòng dán đề vào ô trống!");

    const blocks = textRaw.split(/Câu\s+\d+[:.]/i).filter(b => b.trim() !== "");
    
    blocks.forEach(block => {
        const lines = block.split('\n').map(l => l.trim()).filter(l => l !== "");
        if (lines.length === 0) return;

        let question = lines[0];
        let options = [];
        let exp = "";

        lines.slice(1).forEach(line => {
            if (line.startsWith("HD:") || line.startsWith("Giải thích:")) {
                exp = line.replace(/^(HD:|Giải thích:)\s*/i, "").trim();
            } else if (line.match(/^[\*]?[A-D][\.\)]/i)) {
                let isCorrect = line.startsWith("*");
                let text = line.replace(/^[\*]?[A-D][\.\)]\s*/i, "").trim();
                options.push({ text: text, isCorrect: isCorrect, exp: "" });
            }
        });

        options.forEach(opt => { if (opt.isCorrect) opt.exp = exp; });
        window.danhSachCauHoi.push({ type: "trac-nghiem", question: question, options: options });
    });

    document.getElementById('bulk-input').value = ""; // Xóa sau khi bóc
    renderPreview();
});

// Hiển thị khung xem trước để rà soát lỗi
function renderPreview() {
    let html = `<strong>Tổng số câu đang có: ${window.danhSachCauHoi.length}</strong>`;
    window.danhSachCauHoi.forEach((cau, i) => {
        if(cau.type === "trac-nghiem") {
            html += `<div style="border-left: 3px solid #8ab4f8; background: #202124; padding: 15px; margin-top: 15px; border-radius: 8px;">
                        <strong style="color:#8ab4f8">Câu ${i + 1}:</strong>
                        <textarea onchange="window.danhSachCauHoi[${i}].question = this.value" style="margin-top: 8px;">${cau.question}</textarea>`;
            
            cau.options.forEach((opt, j) => {
                let checked = opt.isCorrect ? "checked" : "";
                html += `<div style="display:flex; align-items:center; margin-bottom:5px;">
                            <input type="radio" name="correct-${i}" ${checked} style="width:auto; margin-right:10px;" 
                                onchange="window.danhSachCauHoi[${i}].options.forEach(o => o.isCorrect = false); window.danhSachCauHoi[${i}].options[${j}].isCorrect = true;">
                            <input type="text" value="${opt.text}" style="margin:0;" onchange="window.danhSachCauHoi[${i}].options[${j}].text = this.value">
                        </div>`;
            });
            html += `</div>`;
        }
    });
    
    document.getElementById('preview-area').innerHTML = html;
    
    if (typeof renderMathInElement === "function") {
        renderMathInElement(document.getElementById('preview-area'), { delimiters: [{left: "$$", right: "$$", display: false}] });
    }
}

// Lưu lên Firebase
document.getElementById('btn-save').addEventListener('click', async () => {
    if (window.danhSachCauHoi.length === 0) return alert("Chưa có câu hỏi nào để tạo link!");

    const saveBtn = document.getElementById('btn-save');
    saveBtn.innerText = "Đang tạo link...";
    saveBtn.disabled = true;

    try {
        const docRef = await addDoc(collection(db, "quizzes"), { danhSach: window.danhSachCauHoi });
        const link = `${window.location.origin + window.location.pathname}?id=${docRef.id}`;
        document.getElementById('link-result').innerHTML = `<b>Link bài tập của bạn:</b><br><a href="${link}" style="color:#8ab4f8; word-break: break-all; font-size: 18px;" target="_blank">${link}</a>`;
    } catch (error) {
        alert("Lỗi kết nối Firebase: " + error.message);
    } finally {
        saveBtn.innerText = "LƯU TOÀN BỘ & TẠO LINK";
        saveBtn.disabled = false;
    }
});

// Tải đề cho học sinh làm
async function loadQuiz(id) {
    try {
        const docSnap = await getDoc(doc(db, "quizzes", id));
        if (docSnap.exists()) {
            quizDataGlobal = docSnap.data().danhSach;
            currentQuestionIndex = 0;
            score = 0; 
            renderCurrentQuestion();
        } else {
            document.getElementById('quiz-content').innerHTML = "Không tìm thấy đề bài!";
        }
    } catch (err) {
        document.getElementById('quiz-content').innerHTML = "Lỗi tải đề: " + err.message;
    }
}

// Hiển thị câu hỏi cho học sinh
function renderCurrentQuestion() {
    const container = document.getElementById('quiz-content');

    if (currentQuestionIndex >= quizDataGlobal.length) {
        container.innerHTML = `<div class="card" style="text-align: center; border-left: 4px solid #4caf50;">
                                    <h2>🎉 Hoàn thành bài làm!</h2>
                                    <p style="font-size: 20px;">Số câu đúng: <strong style="color: #4caf50;">${score} / ${quizDataGlobal.length}</strong></p>
                               </div>`;
        return;
    }

    const cauHoi = quizDataGlobal[currentQuestionIndex];
    let html = `<div class="card" style="margin-top: 20px; border-left: 4px solid #8ab4f8;">
                    <strong>Câu ${currentQuestionIndex + 1} / ${quizDataGlobal.length}:</strong> ${cauHoi.question}
                </div>`;
    
    if (cauHoi.type === 'trac-nghiem') {
        cauHoi.options.forEach((opt, i) => {
            const letter = String.fromCharCode(65 + i); 
            const label = cauHoi.options.length === 2 ? "" : `<strong>${letter}.</strong> `;
            html += `
                <div class="card option trac-nghiem-opt">
                    ${label}${opt.text}
                    <div class="explanation">${opt.exp || "Không có giải thích"}</div>
                </div>`;
        });
    } else {
        html += `
            <textarea class="user-answer" placeholder="Nhập câu trả lời..."></textarea>
            <div class="card option" onclick="this.classList.toggle('active')" style="margin-top: 10px; background-color: #202124;">
                <strong>👁️ Bấm xem đáp án gốc</strong>
                <div class="explanation">${cauHoi.answerKey}</div>
            </div>`;
    }

    html += `<button id="btn-next" style="margin-top: 15px; width: 100%; padding: 14px; font-size: 16px;">Xác nhận & Chuyển câu tiếp</button>`;
    container.innerHTML = html;

    if (typeof renderMathInElement === "function") {
        renderMathInElement(container, { delimiters: [{left: "$$", right: "$$", display: false}] });
    }

    if (cauHoi.type === 'trac-nghiem') {
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
                    score++; 
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

    document.getElementById('btn-next').addEventListener('click', () => {
        currentQuestionIndex++;
        renderCurrentQuestion(); 
    });
}
