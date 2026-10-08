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

// ----------------------------------------------------
// TÍNH NĂNG NHẬP NHANH TỪ VĂN BẢN
// ----------------------------------------------------
const toggleBulk = document.getElementById('toggle-bulk');
if (toggleBulk) {
    toggleBulk.addEventListener('click', () => {
        const bulkArea = document.getElementById('bulk-area');
        const bulkIcon = document.getElementById('bulk-icon');
        if (bulkArea.style.display === 'none') {
            bulkArea.style.display = 'block'; bulkIcon.innerText = '▲';
        } else {
            bulkArea.style.display = 'none'; bulkIcon.innerText = '▼';
        }
    });
}

const btnBulkAdd = document.getElementById('btn-bulk-add');
if (btnBulkAdd) {
    btnBulkAdd.addEventListener('click', () => {
        const text = document.getElementById('bulk-input').value.trim();
        if (!text) return alert("Vui lòng dán văn bản câu hỏi vào ô nhé!");

        const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
        let currentQ = null;
        let addedCount = 0;
        
        function saveParsedQ(q) {
            if (q.options.length === 4) {
                let rawAns = q.ansKey.toUpperCase().replace(/\s+/g, '');
                if (rawAns === 'A' || rawAns === 'B' || rawAns === 'C' || rawAns === 'D') {
                    const cIndex = rawAns.charCodeAt(0) - 65;
                    window.danhSachCauHoi.push({
                        type: "trac-nghiem", question: q.question,
                        options: [
                            { text: q.options[0], isCorrect: cIndex === 0 },
                            { text: q.options[1], isCorrect: cIndex === 1 },
                            { text: q.options[2], isCorrect: cIndex === 2 },
                            { text: q.options[3], isCorrect: cIndex === 3 }
                        ]
                    });
                } else {
                    let boolValues = [];
                    let parts = q.ansKey.toUpperCase().split(/[,;.\-]/);
                    if (parts.length >= 4) {
                        parts.forEach(p => boolValues.push(p.includes('Đ') || p.includes('T')));
                    } else {
                        for(let char of q.ansKey.toUpperCase()) {
                            if (char === 'Đ') boolValues.push(true);
                            if (char === 'S') boolValues.push(false);
                        }
                    }
                    while(boolValues.length < 4) boolValues.push(false);

                    window.danhSachCauHoi.push({
                        type: "dung-sai", question: q.question,
                        statements: [
                            { text: q.options[0], isTrue: boolValues[0] },
                            { text: q.options[1], isTrue: boolValues[1] },
                            { text: q.options[2], isTrue: boolValues[2] },
                            { text: q.options[3], isTrue: boolValues[3] }
                        ]
                    });
                }
            } 
            else if (q.options.length === 0) {
                window.danhSachCauHoi.push({
                    type: "tra-loi-ngan", question: q.question, answerKey: q.ansKey
                });
            }
        }

        for(let i=0; i < lines.length; i++) {
            let line = lines[i];
            
            if (line.match(/^(Câu|Bài)\s*\d+:/i) || (!line.match(/^[A-D]\./i) && !line.match(/^Đáp án:/i) && !currentQ)) {
                if (currentQ && currentQ.ansKey) {
                    saveParsedQ(currentQ); addedCount++;
                }
                currentQ = { question: line.replace(/^(Câu|Bài)\s*\d+:\s*/i, ''), options: [], ansKey: null };
            } 
            else if (line.match(/^[A-D]\./i) && currentQ) {
                currentQ.options.push(line.replace(/^[A-D]\.\s*/i, '').trim());
            } 
            else if (line.match(/^Đáp án:/i) && currentQ) {
                currentQ.ansKey = line.replace(/^Đáp án:\s*/i, '').trim();
                saveParsedQ(currentQ); addedCount++;
                currentQ = null;
            } 
            else if (currentQ && currentQ.options.length === 0 && !currentQ.ansKey) {
                currentQ.question += '\n' + line; 
            }
        }
        if (currentQ && currentQ.ansKey) {
            saveParsedQ(currentQ); addedCount++;
        }

        if (addedCount > 0) {
            alert(`🎉 Thành công! Đã tự động phân tích và thêm ${addedCount} câu hỏi!`);
            document.getElementById('bulk-input').value = ''; 
            renderPreview();
            document.getElementById('bulk-area').style.display = 'none';
            document.getElementById('bulk-icon').innerText = '▼';
        } else {
            alert("❌ Không tìm thấy câu hỏi hợp lệ. Bạn nhớ ghi chữ 'Đáp án: ...' ở cuối mỗi câu nhé!");
        }
    });
}
// ----------------------------------------------------

// CẬP NHẬT GIAO DIỆN KHI ĐỔI LOẠI CÂU HỎI
const questionType = document.getElementById('question-type');
if (questionType) {
    function updateFormDisplay() {
        const type = questionType.value;
        
        // 1. Chỉnh Form Thủ công
        const gNghiem = document.getElementById('trac-nghiem-group');
        const gSai = document.getElementById('dung-sai-group');
        const gLoi = document.getElementById('tra-loi-ngan-group');

        if(gNghiem) gNghiem.style.display = (type === 'trac-nghiem') ? 'block' : 'none';
        if(gSai) gSai.style.display = (type === 'dung-sai') ? 'block' : 'none';
        if(gLoi) gLoi.style.display = (type === 'tra-loi-ngan') ? 'block' : 'none';
        
        // 2. Chỉnh bảng Hướng dẫn Nhập Nhanh
        const hNghiem = document.getElementById('bulk-hint-trac-nghiem');
        const hSai = document.getElementById('bulk-hint-dung-sai');
        const hLoi = document.getElementById('bulk-hint-tra-loi-ngan');
        
        if(hNghiem) hNghiem.style.display = (type === 'trac-nghiem') ? 'block' : 'none';
        if(hSai) hSai.style.display = (type === 'dung-sai') ? 'block' : 'none';
        if(hLoi) hLoi.style.display = (type === 'tra-loi-ngan') ? 'block' : 'none';
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
                        <strong style="color:#8ab4f8">Câu ${i + 1}: (${cau.type})</strong>
                        <button onclick="window.danhSachCauHoi.splice(${i}, 1); renderPreview();" style="width:auto; padding:4px 8px; background:#f44336; color:white; font-size:12px; margin:0; border:none; border-radius:4px; cursor:pointer;">Xóa câu này</button>
                    </div>
                    <textarea onchange="window.danhSachCauHoi[${i}].question = this.value" style="width:100%; margin-bottom:10px; background:#303134; color:white; border:1px solid #5f6368; padding:8px;">${cau.question}</textarea>`;

        if (cau.type === "trac-nghiem") {
            cau.options.forEach((opt, j) => {
                let checked = opt.isCorrect ? "checked" : "";
                html += `<div style="display:flex; align-items:center; margin-bottom:5px;">
                            <input type="radio" name="edit-correct-${i}" ${checked} style="width:auto; margin-right:10px;" 
                                onchange="window.danhSachCauHoi[${i}].options.forEach(o => o.isCorrect = false); window.danhSachCauHoi[${i}].options[${j}].isCorrect = true;">
                            <input type="text" value="${opt.text}" style="margin:0; width:100%; background:#303134; color:white; border:1px solid #5f6368; padding:8px;" onchange="window.danhSachCauHoi[${i}].options[${j}].text = this.value">
                        </div>`;
            });
        } else if (cau.type === "dung-sai") {
            cau.statements.forEach((stmt, j) => {
                let checked = stmt.isTrue ? "checked" : "";
                html += `<div style="display:flex; align-items:center; margin-bottom:5px;">
                            <input type="checkbox" ${checked} style="width:auto; margin-right:10px;"
                                onchange="window.danhSachCauHoi[${i}].statements[${j}].isTrue = this.checked">
                            <input type="text" value="${stmt.text}" style="margin:0; width:100%; background:#303134; color:white; border:1px solid #5f6368; padding:8px;" onchange="window.danhSachCauHoi[${i}].statements[${j}].text = this.value">
                        </div>`;
            });
        } else {
            html += `<input type="text" value="${cau.answerKey}" placeholder="Đáp án đúng..." onchange="window.danhSachCauHoi[${i}].answerKey = this.value" style="margin-top:5px; width:100%; background:#303134; color:white; border:1px solid #5f6368; padding:8px;">`;
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
                    <button id="btn-save-score" style="background: #4caf50; color: white; padding: 12px 25px; font-size: 16px; border-radius: 8px; border:none; cursor:pointer;">Lưu & Xem Thống Kê</button>
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
        html += `<button id="btn-check-ds" style="background:#fbbc04; color:#202124; border:none; padding:10px 15px; border-radius:4px; cursor:pointer;">Xác nhận đáp án</button>`;
    } else {
        html += `<input type="text" id="short-ans-input" placeholder="Nhập đáp án của bạn..." style="margin-bottom:10px; padding:10px; width:100%;"><button id="btn-check-short" style="background:#fbbc04; color:#202124; border:none; padding:10px 15px; border-radius:4px; cursor:pointer; width:100%;">Kiểm tra đáp án</button><div id="short-ans-result" style="margin-top:10px; font-weight:bold;"></div>`;
    }

    html += `<button id="btn-next" style="margin-top: 15px; width: 100%; padding: 14px; font-size: 16px; background:#8ab4f8; color:#202124; border:none; border-radius:4px; cursor:pointer;">Chuyển câu tiếp</button>`;
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
