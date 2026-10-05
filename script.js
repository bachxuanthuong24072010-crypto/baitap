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
        document.getElementById('tra-loi-ngan-group').style.display = 'none';

        if (this.value === 'trac-nghiem') document.getElementById('trac-nghiem-group').style.display = 'block';
        else if (this.value === 'dung-sai') document.getElementById('dung-sai-group').style.display = 'block';
        else document.getElementById('tra-loi-ngan-group').style.display = 'block';
    });
}

// Thêm câu hỏi
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
        window.danhSachCauHoi.push({
            type: "dung-sai",
            question: questionText,
            statements: ['a', 'b', 'c', 'd'].map(id => ({
                text: document.getElementById(`ds-opt-${id}`).value.trim(),
                isTrue: document.getElementById(`ds-ans-${id}`).value === 'true'
            }))
        });
    } else {
        window.danhSachCauHoi.push({
            type: "tra-loi-ngan",
            question: questionText,
            answerKey: document.getElementById('answer-key').value.trim()
        });
    }
    
    // Reset form
    document.getElementById('question').value = '';
    ['a', 'b', 'c', 'd'].forEach(id => {
        if(document.getElementById(`opt-${id}`)) document.getElementById(`opt-${id}`).value = '';
        if(document.getElementById(`exp-${id}`)) document.getElementById(`exp-${id}`).value = '';
        if(document.getElementById(`ds-opt-${id}`)) document.getElementById(`ds-opt-${id}`).value = '';
        if(document.getElementById(`ds-ans-${id}`)) document.getElementById(`ds-ans-${id}`).value = 'true';
    });
    if(document.getElementById('answer-key')) document.getElementById('answer-key').value = '';

    renderPreview();
});

// Khung Xem trước & Sửa trực tiếp
function renderPreview() {
    let html = `<h3>Danh sách đã thêm (${window.danhSachCauHoi.length} câu - Có thể sửa trực tiếp):</h3>`;
    window.danhSachCauHoi.forEach((cau, i) => {
        html += `<div style="border-left: 4px solid #8ab4f8; background: #202124; padding: 15px; margin-top: 15px; border-radius: 8px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <strong style="color:#8ab4f8">Câu ${i + 1}:</strong>
                        <button onclick="window.danhSachCauHoi.splice(${i}, 1); renderPreview();" style="width:auto; padding:4px 8px; background:#f44336; color:white; font-size:12px; margin:0;">Xóa câu này</button>
                    </div>
                    <textarea onchange="window.danhSachCauHoi[${i}].question = this.value">${cau.question}</textarea>`;

        if (cau.type === "trac-nghiem") {
            cau.options.forEach((opt, j) => {
                let checked = opt.isCorrect ? "checked" : "";
                html += `<div style="display:flex; align-items:center; margin-bottom:5px;">
                            <input type="radio" name="edit-correct-${i}" ${checked} style="width:auto; margin-right:10px;" 
                                onchange="window.danhSachCauHoi[${i}].options.forEach(o => o.isCorrect = false); window.danhSachCauHoi[${i}].options[${j}].isCorrect = true;">
                            <input type="text" value="${opt.text}" style="margin:0;" onchange="window.danhSachCauHoi[${i}].options[${j}].text = this.value">
                        </div>`;
            });
        } else if (cau.type === "dung-sai") {
            cau.statements.forEach((stmt, j) => {
                let tSel = stmt.isTrue ? "selected" : "";
                let fSel = !stmt.isTrue ? "selected" : "";
                html += `<div style="display:flex; align-items:center; margin-bottom:5px;">
                            <select onchange="window.danhSachCauHoi[${i}].statements[${j}].isTrue = (this.value === 'true')" style="width:90px; margin-right:10px;">
                                <option value="true" ${tSel}>ĐÚNG</option>
                                <option value="false" ${fSel}>SAI</option>
                            </select>
                            <input type="text" value="${stmt.text}" style="margin:0;" onchange="window.danhSachCauHoi[${i}].statements[${j}].text = this.value">
                        </div>`;
            });
        } else {
            html += `<input type="text" value="${cau.answerKey}" placeholder="Đáp án đúng..." onchange="window.danhSachCauHoi[${i}].answerKey = this.value" style="margin-top:5px;">`;
        }
        html += `</div>`;
    });
    
    document.getElementById('preview-area').innerHTML = html;
    
    if (typeof renderMathInElement === "function") {
        renderMathInElement(document.getElementById('preview-area'), { delimiters: [{left: "$$", right: "$$", display: false}] });
    }
}
window.renderPreview = renderPreview;

// Lưu & Tạo link
document.getElementById('btn-save').addEventListener('click', async () => {
    if (window.danhSachCauHoi.length === 0) return alert("Chưa có câu hỏi nào để tạo link!");
    const saveBtn = document.getElementById('btn-save');
    saveBtn.innerText = "Đang tạo link..."; saveBtn.disabled = true;
    try {
        const docRef = await addDoc(collection(db, "quizzes"), { danhSach: window.danhSachCauHoi });
        const link = `${window.location.origin + window.location.pathname}?id=${docRef.id}`;
        document.getElementById('link-result').innerHTML = `<b>Link bài tập:</b><br><a href="${link}" style="color:#8ab4f8; word-break: break-all;" target="_blank">${link}</a>`;
    } catch (error) { alert("Lỗi kết nối: " + error.message); } 
    finally { saveBtn.innerText = "Lưu và tạo Link"; saveBtn.disabled = false; }
});

// Tải đề làm bài
async function loadQuiz(id) {
    try {
        const docSnap = await getDoc(doc(db, "quizzes", id));
        if (docSnap.exists()) {
            quizDataGlobal = docSnap.data().danhSach;
            currentQuestionIndex = 0; score = 0;
            renderCurrentQuestion();
        } else document.getElementById('quiz-content').innerHTML = "Không tìm thấy đề bài!";
    } catch (err) { document.getElementById('quiz-content').innerHTML = "Lỗi tải đề: " + err.message; }
}

// Hiển thị cho học sinh làm
function renderCurrentQuestion() {
    const container = document.getElementById('quiz-content');

    if (currentQuestionIndex >= quizDataGlobal.length) {
        container.innerHTML = `<div class="card" style="text-align: center; border-left: 4px solid #4caf50;">
                                    <h2>🎉 Hoàn thành bài làm!</h2>
                                    <p style="font-size: 20px;">Điểm của bạn: <strong style="color: #4caf50;">${score} / ${quizDataGlobal.length}</strong></p>
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
            html += `<div class="card option trac-nghiem-opt">
                        <strong>${letter}.</strong> ${opt.text}
                        <div class="explanation">${opt.exp || "Không có giải thích"}</div>
                    </div>`;
        });
    } else if (cauHoi.type === 'dung-sai') {
        cauHoi.statements.forEach((stmt, i) => {
            const letter = String.fromCharCode(65 + i); 
            html += `<div class="card" style="margin-bottom:10px;">
                        <strong>${letter}.</strong> ${stmt.text}
                        <div style="margin-top:10px; display:flex; gap:10px;">
                            <button class="btn-tf" data-id="${i}" data-val="true" style="background:#303134; border:1px solid #5f6368; color:white;">ĐÚNG</button>
                            <button class="btn-tf" data-id="${i}" data-val="false" style="background:#303134; border:1px solid #5f6368; color:white;">SAI</button>
                        </div>
                    </div>`;
        });
    } else {
        html += `<input type="text" id="short-ans-input" placeholder="Nhập đáp án của bạn..." style="margin-bottom:10px;">
                 <button id="btn-check-short" style="background:#fbbc04; color:#202124;">Kiểm tra đáp án</button>
                 <div id="short-ans-result" style="margin-top:10px; font-weight:bold;"></div>`;
    }

    html += `<button id="btn-next" style="margin-top: 15px; width: 100%; padding: 14px; font-size: 16px;">Chuyển câu tiếp</button>`;
    container.innerHTML = html;

    if (typeof renderMathInElement === "function") {
        renderMathInElement(container, { delimiters: [{left: "$$", right: "$$", display: false}] });
    }

    // Logic chấm điểm
    if (cauHoi.type === 'trac-nghiem') {
        const optionEls = container.querySelectorAll('.trac-nghiem-opt');
        let answered = false; 
        optionEls.forEach((el, i) => {
            el.addEventListener('click', function() {
                if (answered) return; answered = true;
                this.classList.add('active'); 
                if (cauHoi.options[i].isCorrect) {
                    this.style.borderColor = '#4caf50'; this.innerHTML = "✅ " + this.innerHTML; score++;
                } else {
                    this.style.borderColor = '#f44336'; this.innerHTML = "❌ " + this.innerHTML;
                    optionEls.forEach((optEl, optIndex) => {
                        if (cauHoi.options[optIndex].isCorrect) { optEl.style.borderColor = '#4caf50'; optEl.classList.add('active'); }
                    });
                }
            });
        });
    } else if (cauHoi.type === 'dung-sai') {
        let answeredRows = [false, false, false, false];
        const tfBtns = container.querySelectorAll('.btn-tf');
        tfBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const val = this.getAttribute('data-val') === 'true';
                if (answeredRows[id]) return;
                answeredRows[id] = true;
                
                if (cauHoi.statements[id].isTrue === val) {
                    this.style.backgroundColor = '#4caf50';
                    this.innerHTML = "✅ " + this.innerHTML;
                    score += 0.25; // Đúng 1 ý được 0.25 điểm
                } else {
                    this.style.backgroundColor = '#f44336';
                    this.innerHTML = "❌ " + this.innerHTML;
                    const correctBtn = container.querySelector(`.btn-tf[data-id="${id}"][data-val="${cauHoi.statements[id].isTrue}"]`);
                    correctBtn.style.border = '2px solid #4caf50';
                }
            });
        });
    } else if (cauHoi.type === 'tra-loi-ngan') {
        const btnCheck = document.getElementById('btn-check-short');
        let answered = false;
        btnCheck.addEventListener('click', () => {
            if (answered) return; answered = true;
            const userAns = document.getElementById('short-ans-input').value.trim().toLowerCase();
            const correctAns = cauHoi.answerKey.trim().toLowerCase();
            const resDiv = document.getElementById('short-ans-result');
            
            if (userAns === correctAns) {
                resDiv.style.color = '#4caf50'; resDiv.innerText = "✅ Chính xác!"; score++;
            } else {
                resDiv.style.color = '#f44336'; resDiv.innerText = `❌ Sai. Đáp án đúng là: ${cauHoi.answerKey}`;
            }
        });
    }

    document.getElementById('btn-next').addEventListener('click', () => {
        currentQuestionIndex++; renderCurrentQuestion(); 
    });
}
