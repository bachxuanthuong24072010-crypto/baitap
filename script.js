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

// Bấm thêm câu hỏi
document.getElementById('btn-add').addEventListener('click', () => {
    const questionText = document.getElementById('question').value.trim();
    const imgUrl = document.getElementById('question-img').value.trim();
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
            imageUrl: imgUrl,
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
            imageUrl: imgUrl,
            options: [
                { text: "ĐÚNG", exp: document.getElementById('exp-tf-true').value, isCorrect: tfCorrectIndex === 0 },
                { text: "SAI", exp: document.getElementById('exp-tf-false').value, isCorrect: tfCorrectIndex === 1 }
            ]
        });
    } else {
        window.danhSachCauHoi.push({
            type: type,
            question: questionText,
            imageUrl: imgUrl,
            answerKey: document.getElementById('answer-key').value
        });
    }
    
    // Reset form
    document.getElementById('question').value = '';
    document.getElementById('question-img').value = '';
    ['a', 'b', 'c', 'd'].forEach(id => {
        if(document.getElementById(`opt-${id}`)) document.getElementById(`opt-${id}`).value = '';
        if(document.getElementById(`exp-${id}`)) document.getElementById(`exp-${id}`).value = '';
    });

    renderPreview(); // Gọi hàm hiển thị các câu vừa thêm để soát lỗi
});

// Hàm hiển thị danh sách các câu đã thêm để sửa trực tiếp
function renderPreview() {
    let html = `<h3>Danh sách đã thêm (${window.danhSachCauHoi.length} câu - Có thể sửa trực tiếp):</h3>`;
    window.danhSachCauHoi.forEach((cau, i) => {
        html += `<div style="border-left: 4px solid #8ab4f8; background: #202124; padding: 15px; margin-top: 15px; border-radius: 8px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <strong style="color:#8ab4f8">Câu ${i + 1}:</strong>
                        <button onclick="window.danhSachCauHoi.splice(${i}, 1); renderPreview();" style="width:auto; padding:4px 8px; background:#f44336; color:white; font-size:12px; margin:0;">Xóa câu này</button>
                    </div>
                    <textarea onchange="window.danhSachCauHoi[${i}].question = this.value">${cau.question}</textarea>
                    <input type="text" value="${cau.imageUrl || ''}" placeholder="Link ảnh..." onchange="window.danhSachCauHoi[${i}].imageUrl = this.value">`;

        if (cau.type === "trac-nghiem") {
            cau.options.forEach((opt, j) => {
                let checked = opt.isCorrect ? "checked" : "";
                html += `<div style="display:flex; align-items:center; margin-bottom:5px;">
                            <input type="radio" name="edit-correct-${i}" ${checked} style="width:auto; margin-right:10px;" 
                                onchange="window.danhSachCauHoi[${i}].options.forEach(o => o.isCorrect = false); window.danhSachCauHoi[${i}].options[${j}].isCorrect = true;">
                            <input type="text" value="${opt.text}" style="margin:0;" onchange="window.danhSachCauHoi[${i}].options[${j}].text = this.value">
                        </div>`;
            });
        }
        html += `</div>`;
    });
    
    document.getElementById('preview-area').innerHTML = html;
    
    if (typeof renderMathInElement === "function") {
        renderMathInElement(document.getElementById('preview-area'), { delimiters: [{left: "$$", right: "$$", display: false}] });
    }
}
window.renderPreview = renderPreview;

// Lưu lên Firebase
document.getElementById('btn-save').addEventListener('click', async () => {
    if (window.danhSachCauHoi.length === 0) return alert("Chưa có câu hỏi nào để tạo link!");

    const saveBtn = document.getElementById('btn-save');
    saveBtn.innerText = "Đang tạo link...";
    saveBtn.disabled = true;

    try {
        const docRef = await addDoc(collection(db, "quizzes"), { danhSach: window.danhSachCauHoi });
        const link = `${window.location.origin + window.location.pathname}?id=${docRef.id}`;
        document.getElementById('link-result').innerHTML = `<b>Link bài tập:</b><br><a href="${link}" style="color:#8ab4f8; word-break: break-all;" target="_blank">${link}</a>`;
    } catch (error) {
        alert("Lỗi kết nối Firebase: " + error.message);
    } finally {
        saveBtn.innerText = "Lưu và tạo Link";
        saveBtn.disabled = false;
    }
});

// Tải đề làm bài
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

// Hiển thị cho học sinh làm
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
    let imgHtml = cauHoi.imageUrl ? `<img src="${cauHoi.imageUrl}" style="max-width:100%; border-radius:8px; margin-top:10px; display:block;">` : '';

    let html = `<div class="card" style="margin-top: 20px; border-left: 4px solid #8ab4f8;">
                    <strong>Câu ${currentQuestionIndex + 1} / ${quizDataGlobal.length}:</strong> ${cauHoi.question}
                    ${imgHtml}
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
                <strong>👁️️ Bấm xem đáp án gốc</strong>
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
