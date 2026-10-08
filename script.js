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
let quizStats = {
    'trac-nghiem': { correct: 0, total: 0 },
    'dung-sai': { details: [], total: 0 },
    'tra-loi-ngan': { correct: 0, total: 0 }
};

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
    function updateFormDisplay() {
        const type = questionType.value;
        const gNghiem = document.getElementById('trac-nghiem-group');
        const gSai = document.getElementById('dung-sai-group');
        const gLoi = document.getElementById('tra-loi-ngan-group');

        if(gNghiem) gNghiem.style.display = (type === 'trac-nghiem') ? 'block' : 'none';
        if(gSai) gSai.style.display = (type === 'dung-sai') ? 'block' : 'none';
        if(gLoi) gLoi.style.display = (type === 'tra-loi-ngan') ? 'block' : 'none';
    }
    questionType.addEventListener('change', updateFormDisplay);
    updateFormDisplay();
}

document.getElementById('btn-add').addEventListener('click', () => {
    const questionText = document.getElementById('question').value.trim();
    const type = document.getElementById('question-type').value;

    if (!questionText) return alert("Vui lòng nhập câu hỏi!");

    if (type === 'trac-nghiem') {
        const correctIndex = parseInt(document.querySelector('input[name="correct-answer"]:checked').value);
        window.danhSachCauHoi.push({
            type: "trac-nghiem", question: questionText,
            options: [
                { text: document.getElementById('opt-a').value, isCorrect: correctIndex === 0 },
                { text: document.getElementById('opt-b').value, isCorrect: correctIndex === 1 },
                { text: document.getElementById('opt-c').value, isCorrect: correctIndex === 2 },
                { text: document.getElementById('opt-d').value, isCorrect: correctIndex === 3 }
            ]
        });
    } else if (type === 'dung-sai') {
        window.danhSachCauHoi.push({
            type: "dung-sai", question: questionText,
            statements: ['a', 'b', 'c', 'd'].map(id => ({
                text: document.getElementById(`ds-opt-${id}`).value.trim(),
                isTrue: document.getElementById(`ds-ans-${id}`).checked 
            }))
        });
    } else {
        window.danhSachCauHoi.push({
            type: "tra-loi-ngan", question: questionText, answerKey: document.getElementById('answer-key').value.trim()
        });
    }
    
    document.getElementById('question').value = '';
    ['a', 'b', 'c', 'd'].forEach(id => {
        if(document.getElementById(`opt-${id}`)) document.getElementById(`opt-${id}`).value = '';
        if(document.getElementById(`ds-opt-${id}`)) document.getElementById(`ds-opt-${id}`).value = '';
        if(document.getElementById(`ds-ans-${id}`)) document.getElementById(`ds-ans-${id}`).checked = false;
    });
    if(document.getElementById('answer-key')) document.getElementById('answer-key').value = '';
    renderPreview();
});

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
                let checked = stmt.isTrue ? "checked" : "";
                html += `<div style="display:flex; align-items:center; margin-bottom:5px;">
                            <input type="checkbox" ${checked} style="width:auto; margin-right:10px;"
                                onchange="window.danhSachCauHoi[${i}].statements[${j}].isTrue = this.checked">
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

async function loadQuiz(id) {
    try {
        const docSnap = await getDoc(doc(db, "quizzes", id));
        if (docSnap.exists()) {
            quizDataGlobal = docSnap.data().danhSach;
            currentQuestionIndex = 0;
            quizStats = {
                'trac-nghiem': { correct: 0, total: 0 },
                'dung-sai': { details: [], total: 0 }, 
                'tra-loi-ngan': { correct: 0, total: 0 }
            };
            quizDataGlobal.forEach(q => { if (quizStats[q.type]) quizStats[q.type].total++; });
            renderCurrentQuestion();
        } else document.getElementById('quiz-content').innerHTML = "Không tìm thấy đề bài!";
    } catch (err) { document.getElementById('quiz-content').innerHTML = "Lỗi tải đề: " + err.message; }
}

function renderCurrentQuestion() {
    const container = document.getElementById('quiz-content');

    if (currentQuestionIndex >= quizDataGlobal.length) {
        let resultDetails = "";
        if (quizStats['trac-nghiem'].total > 0) {
            resultDetails += `<p style="font-size: 16px; margin: 10px 0; border-bottom: 1px solid #5f6368; padding-bottom: 15px;"><strong style="color: white;">Trắc nghiệm:</strong> <span style="color: #4caf50; font-weight: bold;">${quizStats['trac-nghiem'].correct} câu đúng</span> / ${quizStats['trac-nghiem'].total} câu</p>`;
        }
        if (quizStats['dung-sai'].total > 0) {
            let dsText = quizStats['dung-sai'].details.map((detail, idx) => `Câu ${idx + 1}: ${detail.correctCount}/4`).join(' ; '); 
            resultDetails += `<p style="font-size: 16px; margin: 10px 0; border-bottom: 1px solid #5f6368; padding-bottom: 15px;"><strong style="color: white;">Đúng / Sai:</strong> <span style="color: #4caf50; font-weight: bold; margin-left: 8px;">${dsText}</span></p>`;
        }
        if (quizStats['tra-loi-ngan'].total > 0) {
            resultDetails += `<p style="font-size: 16px; margin: 10px 0;"><strong style="color: white;">Trả lời ngắn:</strong> <span style="color: #4caf50; font-weight: bold;">${quizStats['tra-loi-ngan'].correct} câu đúng</span> / ${quizStats['tra-loi-ngan'].total} câu</p>`;
        }
        container.innerHTML = `<div class="card" style="border-left: 4px solid #8ab4f8;"><h2 style="text-align: center; margin-bottom: 20px;">📊 Phân tích bài làm</h2><div style="background: #202124; padding: 15px; border-radius: 8px; text-align: left;">${resultDetails}</div></div>`;
        return;
    }

    const cauHoi = quizDataGlobal[currentQuestionIndex];
    let html = `<div class="card" style="margin-top: 20px; border-left: 4px solid #8ab4f8;"><strong>Câu ${currentQuestionIndex + 1} / ${quizDataGlobal.length}:</strong> ${cauHoi.question}</div>`;
    
    if (cauHoi.type === 'trac-nghiem') {
        cauHoi.options.forEach((opt, i) => {
            const letter = String.fromCharCode(65 + i); 
            html += `<div class="card option trac-nghiem-opt"><strong>${letter}.</strong> ${opt.text}</div>`;
        });
    } else if (cauHoi.type === 'dung-sai') {
        html += `<p style="color:#fbbc04; font-size:14px; margin-bottom:10px;">* Tích chọn vào các ô ĐÚNG. Có thể chọn nhiều ý. Bấm "Xác nhận" để kiểm tra.</p>`;
        cauHoi.statements.forEach((stmt, i) => {
            const letter = String.fromCharCode(65 + i); 
            html += `<div class="card option dung-sai-opt" data-id="${i}" style="display: flex; align-items: center; justify-content: flex-start; gap: 10px;"><input type="checkbox" id="student-cb-${i}" style="width: 20px; height: 20px; cursor: pointer; margin: 0;"><label for="student-cb-${i}" style="cursor: pointer; flex: 1; margin: 0;"><strong>${letter}.</strong> ${stmt.text}</label></div>`;
        });
        html += `<button id="btn-check-ds" style="background:#fbbc04; color:#202124;">Xác nhận đáp án</button>`;
    } else {
        html += `<input type="text" id="short-ans-input" placeholder="Nhập đáp án của bạn..." style="margin-bottom:10px;"><button id="btn-check-short" style="background:#fbbc04; color:#202124;">Kiểm tra đáp án</button><div id="short-ans-result" style="margin-top:10px; font-weight:bold;"></div>`;
    }

    html += `<button id="btn-next" style="margin-top: 15px; width: 100%; padding: 14px; font-size: 16px;">Chuyển câu tiếp</button>`;
    container.innerHTML = html;

    if (typeof renderMathInElement === "function") {
        renderMathInElement(container, { delimiters: [{left: "$$", right: "$$", display: false}] });
    }

    let answered = false;
    if (cauHoi.type === 'trac-nghiem') {
        const optionEls = container.querySelectorAll('.trac-nghiem-opt');
        optionEls.forEach((el, i) => {
            el.addEventListener('click', function() {
                if (answered) return; answered = true;
                this.classList.add('active'); 
                if (cauHoi.options[i].isCorrect) {
                    this.style.borderColor = '#4caf50'; this.innerHTML = "✅ " + this.innerHTML; quizStats['trac-nghiem'].correct++; 
                } else {
                    this.style.borderColor = '#f44336'; this.innerHTML = "❌ " + this.innerHTML;
                    optionEls.forEach((optEl, optIndex) => {
                        if (cauHoi.options[optIndex].isCorrect) { optEl.style.borderColor = '#4caf50'; optEl.classList.add('active'); }
                    });
                }
            });
        });
    } else if (cauHoi.type === 'dung-sai') {
        const optionEls = container.querySelectorAll('.dung-sai-opt');
        optionEls.forEach((el, i) => {
            const cb = el.querySelector('input[type="checkbox"]');
            el.addEventListener('click', function(e) {
                if(answered) { e.preventDefault(); return; }
                if (e.target !== cb && e.target.tagName !== 'LABEL') { cb.checked = !cb.checked; }
            });
        });
        document.getElementById('btn-check-ds').addEventListener('click', () => {
            if (answered) return; answered = true;
            let correctCount = 0;
            optionEls.forEach((el, i) => {
                const cb = el.querySelector('input[type="checkbox"]');
                let isSelected = cb.checked; let isCorrect = cauHoi.statements[i].isTrue;
                cb.disabled = true;
                if (isSelected === isCorrect) { correctCount++; el.style.borderColor = '#4caf50'; el.innerHTML += "<span style='margin-left: auto;'> ✅</span>";
                } else { el.style.borderColor = '#f44336'; el.innerHTML += "<span style='margin-left: auto;'> ❌</span>"; }
            });
            quizStats['dung-sai'].details.push({ correctCount: correctCount });
        });
    } else if (cauHoi.type === 'tra-loi-ngan') {
        const btnCheck = document.getElementById('btn-check-short');
        btnCheck.addEventListener('click', () => {
            if (answered) return; answered = true;
            const userAns = document.getElementById('short-ans-input').value.trim().toLowerCase();
            const correctAns = cauHoi.answerKey.trim().toLowerCase();
            const resDiv = document.getElementById('short-ans-result');
            if (userAns === correctAns) { resDiv.style.color = '#4caf50'; resDiv.innerText = "✅ Chính xác!"; quizStats['tra-loi-ngan'].correct++; 
            } else { resDiv.style.color = '#f44336'; resDiv.innerText = `❌ Sai. Đáp án đúng là: ${cauHoi.answerKey}`; }
        });
    }

    document.getElementById('btn-next').addEventListener('click', () => {
        if (!answered && cauHoi.type === 'dung-sai') { quizStats['dung-sai'].details.push({ correctCount: 0 }); }
        currentQuestionIndex++; renderCurrentQuestion(); 
    });
}

// ==========================================
// TÍNH NĂNG TRỢ LÝ AI (HỆ THỐNG 2 AI NỐI TIẾP THEO Ý TƯỞNG CỦA BẠN)
// ==========================================
const rawTextInput = document.getElementById('ai-raw-text');
const btnAiParse = document.getElementById('btn-ai-parse');
const aiStatus = document.getElementById('ai-status');

const _p1 = "AQ.Ab8RN6KATwc";
const _p2 = "iao_L06TOdHldaO";
const _p3 = "6YSeZdYx5QB3f3RRFMHpZE2A";
const MY_GEMINI_API_KEY = _p1 + _p2 + _p3;

if (btnAiParse) {
    btnAiParse.addEventListener('click', async () => {
        const rawText = rawTextInput.value.trim();
        if (!rawText) return alert("Vui lòng dán nội dung câu hỏi thô vào ô!");
        
        btnAiParse.disabled = true;

        try {
            // ----------------------------------------------------
            // AI SỐ 1: BƯỚC DỊCH SANG LATEX
            // ----------------------------------------------------
            aiStatus.innerText = "⏳ Bước 1/2: AI đang dịch văn bản lộn xộn sang công thức Toán LaTeX...";
            
            const prompt1 = `Bạn là chuyên gia Toán học. Nhiệm vụ DUY NHẤT của bạn là đọc đoạn văn bản lộn xộn dưới đây, tìm tất cả các biểu thức Toán học (như "phân số", "tử số", "mẫu số", "mũ", "bình phương", "cộng", "trừ", "nhân", "chia", "phương trình", "bằng"...) và DỊCH TOÀN BỘ chúng sang mã Toán học LaTeX, bọc trong cặp dấu $$. 
Giữ nguyên các chữ tiếng Việt bình thường. Tuyệt đối không giải bài, không tóm tắt, chỉ làm nhiệm vụ dịch công thức.

Ví dụ 1: "Giải phương trình x bình phương cộng 2x bằng 0" -> "Giải phương trình $$x^2 + 2x = 0$$"
Ví dụ 2: "tử số là x mũ 3 trừ đi 1, mẫu số là x trừ 1" -> "tử số là $$x^3 - 1$$, mẫu số là $$x - 1$$"

Văn bản cần dịch:
"""${rawText}"""`;

            const res1 = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${MY_GEMINI_API_KEY}`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt1 }] }] })
            });
            const data1 = await res1.json();
            if (data1.error) throw new Error("Lỗi AI 1: " + data1.error.message); 
            const latexText = data1.candidates[0].content.parts[0].text.trim();

            // ----------------------------------------------------
            // AI SỐ 2: BƯỚC TRÍCH XUẤT JSON (CHẠY NGẦM)
            // ----------------------------------------------------
            aiStatus.innerText = "⏳ Bước 2/2: AI đang trích xuất dữ liệu để tự động điền...";

            const prompt2 = `Nhiệm vụ của bạn là đọc câu hỏi đã được format công thức dưới đây và trích xuất thành định dạng JSON.
Tuyệt đối giữ nguyên mọi công thức $$...$$ trong văn bản, BÊ NGUYÊN XI chúng vào các giá trị của JSON.

Có 3 loại câu hỏi (type): "trac-nghiem", "dung-sai", "tra-loi-ngan".
1. Nếu là trắc nghiệm:
   JSON: {"type": "trac-nghiem", "question": "Nội dung câu", "options": ["đáp án A", "đáp án B", "đáp án C", "đáp án D"], "correctIndex": 0} 
2. Nếu là Đúng/Sai nhiều ý:
   JSON: {"type": "dung-sai", "question": "Nội dung câu", "statements": [{"text": "ý 1", "isTrue": true/false}, {"text": "ý 2", "isTrue": true/false}, {"text": "ý 3", "isTrue": true/false}, {"text": "ý 4", "isTrue": true/false}]}
3. Nếu là trả lời ngắn:
   JSON: {"type": "tra-loi-ngan", "question": "Nội dung câu hỏi", "answerKey": "đáp án"}

Câu hỏi cần phân tích:
"""${latexText}"""

CHÚ Ý: Chỉ trả về ĐÚNG 1 chuỗi JSON hợp lệ, không bọc trong dấu markdown.`;

            const res2 = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${MY_GEMINI_API_KEY}`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt2 }] }] })
            });
            const data2 = await res2.json();
            if (data2.error) throw new Error("Lỗi AI 2: " + data2.error.message); 

            let aiText = data2.candidates[0].content.parts[0].text.trim();
            if (aiText.startsWith("```json")) aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
            if (aiText.startsWith("```")) aiText = aiText.replace(/```/g, "").trim();

            const result = JSON.parse(aiText);
            
            document.getElementById('question-type').value = result.type;
            document.getElementById('question-type').dispatchEvent(new Event('change')); 
            
            document.getElementById('question').value = result.question;

            if (result.type === 'trac-nghiem') {
                document.getElementById('opt-a').value = result.options[0] || '';
                document.getElementById('opt-b').value = result.options[1] || '';
                document.getElementById('opt-c').value = result.options[2] || '';
                document.getElementById('opt-d').value = result.options[3] || '';
                const radios = document.querySelectorAll('input[name="correct-answer"]');
                radios.forEach(r => r.checked = false);
                if(radios[result.correctIndex]) radios[result.correctIndex].checked = true;
            } else if (result.type === 'dung-sai') {
                const ids = ['a', 'b', 'c', 'd'];
                result.statements.forEach((stmt, i) => {
                    if (i < 4) {
                        document.getElementById(`ds-opt-${ids[i]}`).value = stmt.text;
                        document.getElementById(`ds-ans-${ids[i]}`).checked = stmt.isTrue;
                    }
                });
            } else if (result.type === 'tra-loi-ngan') {
                document.getElementById('answer-key').value = result.answerKey;
            }

            aiStatus.innerText = "✅ Hệ thống 2 AI đã xử lý xong! Bạn hãy kiểm tra lại và bấm 'Thêm câu hỏi này'.";
            rawTextInput.value = ''; 
        } catch (error) {
            console.error(error);
            aiStatus.innerText = "❌ Lỗi hệ thống: " + error.message;
        } finally {
            btnAiParse.disabled = false;
        }
    });
}
