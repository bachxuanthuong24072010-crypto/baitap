import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

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
let quizTitleGlobal = "Bài Tập Trắc Nghiệm";
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
        const checkedEl = document.querySelector('input[name="correct-answer"]:checked');
        const correctIndex = checkedEl ? parseInt(checkedEl.value) : 0;
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
    
    let titleInput = document.getElementById('quiz-title').value.trim();
    if (!titleInput) titleInput = "Bài Tập Tổng Hợp";

    const saveBtn = document.getElementById('btn-save');
    saveBtn.innerText = "Đang tạo đề thi lên Đám mây..."; saveBtn.disabled = true;
    try {
        const docRef = await addDoc(collection(db, "quizzes"), { 
            title: titleInput,
            danhSach: window.danhSachCauHoi,
            leaderboard: [] 
        });
        
        // Rút gọn link
        saveBtn.innerText = "Đang nén Link cho ngắn lại...";
        const longLink = `${window.location.origin + window.location.pathname}?id=${docRef.id}`;
        let finalLink = longLink;
        
        try {
            const shortResponse = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longLink)}`);
            if (shortResponse.ok) {
                finalLink = await shortResponse.text();
            }
        } catch (e) {
            console.log("Không thể rút gọn link, dùng link gốc");
        }

        document.getElementById('link-result').innerHTML = `
            <div style="background: #e8f0fe; color: #1a73e8; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <b style="font-size: 16px;">✨ Link bài tập của bạn đã sẵn sàng:</b><br><br>
                <a href="${finalLink}" style="font-size: 20px; font-weight: bold; text-decoration: underline;" target="_blank">${finalLink}</a>
                <p style="margin-top: 10px; font-size: 13px; color: #5f6368;">(Hãy copy link ngắn này để gửi cho học sinh nhé)</p>
            </div>
        `;
    } catch (error) { alert("Lỗi kết nối: " + error.message); } 
    finally { saveBtn.innerText = "Lưu đề thi và tạo Link"; saveBtn.disabled = false; }
});

async function loadQuiz(id) {
    try {
        const docSnap = await getDoc(doc(db, "quizzes", id));
        if (docSnap.exists()) {
            const data = docSnap.data();
            quizDataGlobal = data.danhSach;
            quizTitleGlobal = data.title || "Bài Tập Trắc Nghiệm";
            
            document.title = quizTitleGlobal;

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
        
        let totalPossible = quizStats['trac-nghiem'].total + quizStats['tra-loi-ngan'].total + quizStats['dung-sai'].total;
        let earned = quizStats['trac-nghiem'].correct + quizStats['tra-loi-ngan'].correct;
        
        if (quizStats['trac-nghiem'].total > 0) {
            resultDetails += `<p style="font-size: 16px; margin: 10px 0; border-bottom: 1px solid #5f6368; padding-bottom: 15px;"><strong style="color: white;">Trắc nghiệm:</strong> <span style="color: #4caf50; font-weight: bold;">${quizStats['trac-nghiem'].correct} câu đúng</span> / ${quizStats['trac-nghiem'].total} câu</p>`;
        }
        if (quizStats['dung-sai'].total > 0) {
            let dsText = quizStats['dung-sai'].details.map((detail, idx) => `Câu ${idx + 1}: ${detail.correctCount}/4`).join(' ; '); 
            resultDetails += `<p style="font-size: 16px; margin: 10px 0; border-bottom: 1px solid #5f6368; padding-bottom: 15px;"><strong style="color: white;">Đúng / Sai:</strong> <span style="color: #4caf50; font-weight: bold; margin-left: 8px;">${dsText}</span></p>`;
            quizStats['dung-sai'].details.forEach(d => { earned += d.correctCount / 4; });
        }
        if (quizStats['tra-loi-ngan'].total > 0) {
            resultDetails += `<p style="font-size: 16px; margin: 10px 0;"><strong style="color: white;">Trả lời ngắn:</strong> <span style="color: #4caf50; font-weight: bold;">${quizStats['tra-loi-ngan'].correct} câu đúng</span> / ${quizStats['tra-loi-ngan'].total} câu</p>`;
        }

        let score10 = totalPossible > 0 ? ((earned / totalPossible) * 10).toFixed(2) : 0;

        container.innerHTML = `
            <h1 style="text-align: center; color: #8ab4f8; margin-bottom: 20px;">${quizTitleGlobal}</h1>
            <div class="card" style="border-left: 4px solid #8ab4f8;">
                <h2 style="text-align: center; margin-bottom: 20px;">📊 Phân tích bài làm</h2>
                <div style="background: #202124; padding: 15px; border-radius: 8px; text-align: left;">${resultDetails}</div>
                <h2 style="text-align: center; color: #fbbc04; margin-top: 20px; font-size: 28px;">Tổng điểm: ${score10} / 10</h2>
                
                <div style="margin-top: 30px; text-align: center; background: #303134; padding: 20px; border-radius: 8px;">
                    <p style="margin-top: 0; color: #e8eaed;">Lưu kết quả của bạn vào Bảng Thống Kê</p>
                    <input type="text" id="student-name" placeholder="Nhập Họ Tên / Lớp của bạn..." style="padding: 12px; width: 90%; border-radius: 8px; margin-bottom: 15px; font-size: 16px;">
                    <br>
                    <button id="btn-save-score" style="background: #4caf50; color: white; padding: 12px 25px; font-size: 16px; border-radius: 8px;">Lưu & Xem Thống Kê</button>
                </div>
            </div>
        `;

        document.getElementById('btn-save-score').addEventListener('click', async () => {
            const stuName = document.getElementById('student-name').value.trim();
            if(!stuName) return alert("Vui lòng nhập tên của bạn!");
            
            const btn = document.getElementById('btn-save-score');
            btn.innerText = "Đang lưu..."; btn.disabled = true;
            
            try {
                await updateDoc(doc(db, "quizzes", quizId), {
                    leaderboard: arrayUnion({
                        name: stuName,
                        score: parseFloat(score10),
                        timestamp: new Date().toISOString()
                    })
                });
                showLeaderboard(quizId);
            } catch(e) {
                alert("Lỗi khi lưu điểm: " + e.message);
                btn.innerText = "Thử lại"; btn.disabled = false;
            }
        });
        return;
    }

    const cauHoi = quizDataGlobal[currentQuestionIndex];
    let html = `<h2 style="text-align: center; color: #8ab4f8; margin-bottom: 20px;">${quizTitleGlobal}</h2>`;
    html += `<div class="card" style="border-left: 4px solid #8ab4f8;"><strong>Câu ${currentQuestionIndex + 1} / ${quizDataGlobal.length}:</strong> ${cauHoi.question}</div>`;
    
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

async function showLeaderboard(id) {
    document.getElementById('quiz-panel').style.display = 'none';
    document.getElementById('leaderboard-panel').style.display = 'block';
    
    const lbContent = document.getElementById('leaderboard-content');
    lbContent.innerHTML = "<h2 style='text-align:center;'>Đang tải dữ liệu...</h2>";
    
    try {
        const docSnap = await getDoc(doc(db, "quizzes", id));
        const data = docSnap.data();
        let lb = data.leaderboard || [];
        
        lb.sort((a, b) => b.score - a.score || new Date(a.timestamp) - new Date(b.timestamp));
        
        let html = `
        <div class="card" style="border: 1px solid #5f6368; padding: 20px;">
            <h2 style="text-align: center; color: #8ab4f8; margin-bottom: 10px;">BẢNG THỐNG KÊ KẾT QUẢ</h2>
            <h3 style="text-align: center; color: #e8eaed; margin-bottom: 25px; font-weight: normal;">Đề thi: ${data.title}</h3>
            
            <table style="width: 100%; border-collapse: collapse; color: white; border: 1px solid #5f6368;">
                <thead>
                    <tr style="background: #303134;">
                        <th style="padding: 12px; border: 1px solid #5f6368; width: 15%; text-align: center;">STT</th>
                        <th style="padding: 12px; border: 1px solid #5f6368; text-align: left;">Họ và Tên học sinh</th>
                        <th style="padding: 12px; border: 1px solid #5f6368; width: 25%; text-align: center;">Điểm số</th>
                    </tr>
                </thead>
                <tbody>`;
                
        lb.forEach((entry, i) => {
            html += `
                <tr style="background: ${i % 2 === 0 ? 'transparent' : '#2a2b2f'};">
                    <td style="padding: 10px; border: 1px solid #5f6368; text-align: center;">${i + 1}</td>
                    <td style="padding: 10px; border: 1px solid #5f6368;">${entry.name}</td>
                    <td style="padding: 10px; border: 1px solid #5f6368; text-align: center; font-weight: bold; color: #8ab4f8;">${entry.score}</td>
                </tr>`;
        });

        if (lb.length === 0) {
            html += `<tr><td colspan="3" style="padding: 15px; text-align: center; border: 1px solid #5f6368;">Chưa có học sinh nào nộp bài.</td></tr>`;
        }
        
        html += `</tbody></table></div>`;
        lbContent.innerHTML = html;
    } catch(e) {
        lbContent.innerHTML = "Lỗi tải dữ liệu: " + e.message;
    }
}

// AI CHATBOT BẢN 2.5 (KHÔNG BAO GIỜ HẾT LƯỢT HỎI)
const chatInput = document.getElementById('chat-input');
const btnChatSend = document.getElementById('btn-chat-send');
const chatHistoryBox = document.getElementById('chat-history');
const _p1 = "AQ.Ab8RN6KATwc"; const _p2 = "iao_L06TOdHldaO"; const _p3 = "6YSeZdYx5QB3f3RRFMHpZE2A";
const MY_GEMINI_API_KEY = _p1 + _p2 + _p3;
const thoiGianHienTai = new Date().toLocaleString('vi-VN');

let conversationContext = [
    {
        "role": "user",
        "parts": [{ "text": `Bạn là AI Agent giáo dục. Thông tin hệ thống: Hôm nay là ${thoiGianHienTai}. Bạn có khả năng chat bình thường và có quyền Gọi Hàm (Function Calling) để điền form. 
LƯU Ý CỰC KỲ QUAN TRỌNG: 
1. Bất cứ khi nào người dùng yêu cầu tạo câu hỏi, bạn PHẢI GỌI HÀM fill_quiz_form. 
2. Nếu người dùng yêu cầu tạo NHIỀU câu hỏi (Ví dụ: tạo 3 câu, 5 câu), bạn BẮT BUỘC PHẢI GỌI HÀM fill_quiz_form NHIỀU LẦN LIÊN TỤC trong cùng một lượt trả lời (mỗi câu hỏi tương ứng với 1 lần gọi hàm).
3. Mọi công thức Toán, Lý, Hóa trong đề bài và đáp án phải được dịch sang LaTeX và bọc trong cặp dấu $$...$$.` }]
    },
    { "role": "model", "parts": [{ "text": "Đã rõ lệnh! Em có thể gọi hàm liên tục để tạo ra bao nhiêu câu hỏi tùy ý Thầy/Cô ạ." }] }
];

const aiTools = [{
    functionDeclarations: [{
        name: "fill_quiz_form", description: "Gọi hàm này ĐỂ TỰ ĐỘNG ĐIỀN câu hỏi và đáp án vào form.",
        parameters: {
            type: "OBJECT",
            properties: {
                type: { type: "STRING" }, question: { type: "STRING" }, options: { type: "ARRAY", items: { type: "STRING" } },
                correctIndex: { type: "INTEGER" },
                statements: { type: "ARRAY", items: { type: "OBJECT", properties: { text: { type: "STRING" }, isTrue: { type: "BOOLEAN" } } } },
                answerKey: { type: "STRING" }
            },
            required: ["type", "question"]
        }
    }]
}];

function appendMessage(sender, text) {
    if (!chatHistoryBox) return null;
    const msgDiv = document.createElement('div');
    msgDiv.style.padding = '10px 15px'; msgDiv.style.borderRadius = '15px'; msgDiv.style.maxWidth = '85%'; msgDiv.style.fontSize = '15px'; msgDiv.style.lineHeight = '1.4'; msgDiv.style.whiteSpace = 'pre-wrap'; msgDiv.style.marginBottom = '15px';
    if (sender === 'user') { msgDiv.style.background = '#8ab4f8'; msgDiv.style.color = '#202124'; msgDiv.style.borderTopRightRadius = '0'; msgDiv.style.alignSelf = 'flex-end';
    } else { msgDiv.style.background = '#3c4043'; msgDiv.style.color = 'white'; msgDiv.style.borderTopLeftRadius = '0'; msgDiv.style.alignSelf = 'flex-start'; }
    msgDiv.innerText = text; chatHistoryBox.appendChild(msgDiv); chatHistoryBox.scrollTop = chatHistoryBox.scrollHeight;
    if (typeof renderMathInElement === "function") renderMathInElement(msgDiv, { delimiters: [{left: "$$", right: "$$", display: false}] });
    return msgDiv;
}

function executeFillForm(args) {
    try {
        document.getElementById('question-type').value = args.type; document.getElementById('question-type').dispatchEvent(new Event('change')); document.getElementById('question').value = args.question || '';
        if (args.type === 'trac-nghiem' && args.options) {
            ['a','b','c','d'].forEach((id, idx) => document.getElementById(`opt-${id}`).value = args.options[idx] || '');
            const radios = document.querySelectorAll('input[name="correct-answer"]'); radios.forEach(r => r.checked = false);
            if(args.correctIndex !== undefined && radios[args.correctIndex]) radios[args.correctIndex].checked = true;
        } else if (args.type === 'dung-sai' && args.statements) {
            ['a','b','c','d'].forEach((id, i) => { if (i < 4) { document.getElementById(`ds-opt-${id}`).value = args.statements[i].text || ''; document.getElementById(`ds-ans-${id}`).checked = args.statements[i].isTrue || false; } });
        } else if (args.type === 'tra-loi-ngan') document.getElementById('answer-key').value = args.answerKey || '';
        return true;
    } catch (e) { return false; }
}

if (btnChatSend) {
    btnChatSend.addEventListener('click', async () => {
        const userText = chatInput.value.trim(); if (!userText) return; chatInput.value = ''; appendMessage('user', userText);
        const loadingMsg = appendMessage('model', '⏳ Đang phân tích...');
        conversationContext.push({ "role": "user", "parts": [{ "text": userText }] });

        try {
            // ĐÃ CHUYỂN SANG 2.5 FLASH Ở ĐÂY ĐỂ TRÁNH LỖI QUOTA
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${MY_GEMINI_API_KEY}`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: conversationContext, tools: aiTools })
            });
            const data = await response.json(); if (data.error) throw new Error(data.error.message); 
            loadingMsg.remove();
            
            const message = data.candidates[0].content; conversationContext.push(message);
            let addedCount = 0; let functionResponses = [];

            for (let part of message.parts) {
                if (part.text) appendMessage('model', part.text);
                if (part.functionCall && part.functionCall.name === "fill_quiz_form") {
                    if (executeFillForm(part.functionCall.args)) {
                        document.getElementById('btn-add').click(); addedCount++;
                        functionResponses.push({ "functionResponse": { "name": "fill_quiz_form", "response": { "result": "Thành công" } } });
                    }
                }
            }
            if (functionResponses.length > 0) {
                conversationContext.push({ "role": "user", "parts": functionResponses });
                appendMessage('model', `🤖 [Hành động]: Đã tạo và tự động thêm ${addedCount} câu hỏi vào Danh Sách bên dưới!`);
            }
        } catch (error) { loadingMsg.innerText = "❌ Có lỗi xảy ra: " + error.message; conversationContext.pop(); }
    });
    chatInput.addEventListener('keypress', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); btnChatSend.click(); } });
}
