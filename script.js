// ★★★ ここに発行したGASのURLを貼り付けてね！！ ★★★
const GAS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxYjDGGS4QFsCRHj7Q0tnn_WUxIJ5WhrfCLBo-b7mz426Ge0qRrU34ARRwRXcvDsqx2/exec";

document.addEventListener("DOMContentLoaded", () => {
    let currentStep = 0;
    let userStack = [[], [], [], [], [], [], [], []];
    let selfType = "";

    const startScreen = document.getElementById("start-screen");
    const quizScreen = document.getElementById("quiz-screen");
    const resultScreen = document.getElementById("result-screen");
    const optionsContainer = document.getElementById("options-container");
    
    // ナビゲーション関連
    const homeLink = document.getElementById("home-link");
    const backToTitleBtn = document.getElementById("back-to-title-btn");

    // トースト通知関数
    function showToast(message) {
        const toast = document.getElementById("toast");
        toast.textContent = message;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 3000);
    }

    // 画面のナビゲーションを切り替える関数
    function updateTopNav(state) {
        if (state === "start") {
            homeLink.classList.remove("hidden");
            backToTitleBtn.classList.add("hidden");
        } else {
            homeLink.classList.add("hidden");
            backToTitleBtn.classList.remove("hidden");
        }
    }

    // スタートボタン
    document.getElementById("start-btn").addEventListener("click", () => {
        selfType = document.getElementById("self-type").value || "未入力";
        startScreen.classList.add("hidden");
        quizScreen.classList.remove("hidden");
        updateTopNav("quiz");
        renderStep();
    });

    // 次へボタン
    document.getElementById("next-btn").addEventListener("click", () => {
        if (userStack[currentStep].length === 0) {
            showToast("最低でも1つ選んでね！（迷ったら「ピンとこない」を選択！）");
            return;
        }
        currentStep++;
        if (currentStep >= 8) {
            showResult();
        } else {
            renderStep();
        }
    });

    // 戻るボタン
    document.getElementById("back-btn").addEventListener("click", () => {
        if (currentStep > 0) {
            currentStep--;
            renderStep();
        }
    });

    // リトライ（もう一度診断）＆ タイトルに戻る ボタンの共通処理
    function resetQuiz() {
        currentStep = 0;
        userStack = [[], [], [], [], [], [], [], []];
        resultScreen.classList.add("hidden");
        quizScreen.classList.add("hidden");
        startScreen.classList.remove("hidden");
        updateTopNav("start");
    }

    document.getElementById("retry-btn").addEventListener("click", resetQuiz);
    backToTitleBtn.addEventListener("click", resetQuiz);

    // 質問画面の描画
    function renderStep() {
        const block = blocks[currentStep];
        document.getElementById("progress-text").textContent = `${currentStep + 1} / 8`;
        document.getElementById("block-name").textContent = block.name;
        document.getElementById("block-desc").textContent = block.desc;

        document.getElementById("back-btn").style.display = currentStep === 0 ? "none" : "block";

        optionsContainer.innerHTML = "";
        const currentOptions = questionsData[currentStep];

        // 各選択肢の生成
        currentOptions.forEach(opt => {
            const card = document.createElement("div");
            card.className = "option-card";
            if (userStack[currentStep].includes(opt.id)) card.classList.add("active");
            card.innerHTML = `<span>${opt.text}</span>`;
            
            card.addEventListener("click", () => {
                const noneIndex = userStack[currentStep].indexOf("none");
                if (noneIndex > -1) userStack[currentStep].splice(noneIndex, 1);
                
                const index = userStack[currentStep].indexOf(opt.id);
                if (index > -1) {
                    userStack[currentStep].splice(index, 1);
                    card.classList.remove("active");
                } else {
                    userStack[currentStep].push(opt.id);
                    card.classList.add("active");
                }
                updateNoneCardStyle();
            });
            optionsContainer.appendChild(card);
        });

        // 「ピンとこない」選択肢
        const noneCard = document.createElement("div");
        noneCard.className = "option-card";
        noneCard.id = "none-card";
        noneCard.innerHTML = `<span>🤔 どれもピンとこない・わからない</span>`;
        if (userStack[currentStep].includes("none")) noneCard.classList.add("none-active");

        noneCard.addEventListener("click", () => {
            userStack[currentStep] = ["none"];
            Array.from(optionsContainer.children).forEach(child => child.classList.remove("active"));
            noneCard.classList.add("none-active");
        });
        optionsContainer.appendChild(noneCard);
    }

    function updateNoneCardStyle() {
        const noneCard = document.getElementById("none-card");
        if (!userStack[currentStep].includes("none")) noneCard.classList.remove("none-active");
    }

    // ★結果発表＆スコア計算＆GAS送信
    function showResult() {
        quizScreen.classList.add("hidden");
        document.getElementById("display-self-type").textContent = selfType;

        // 履歴リストの生成
        const historyList = document.getElementById("user-history-list");
        historyList.innerHTML = "";
        for (let i = 0; i < 8; i++) {
            const li = document.createElement("li");
            const funcNames = userStack[i].includes("none") ? "ピンとこない" : userStack[i].join(", ");
            li.innerHTML = `<strong>${blocks[i].name}:</strong> ${funcNames}`;
            historyList.appendChild(li);
        }

        // スコア計算
        let scores = [];
        for (const [typeName, typeInfo] of Object.entries(typeDetails)) {
            let score = 0;
            const idealStack = typeInfo.stack;

            for (let i = 0; i < 8; i++) {
                const userAnswers = userStack[i];
                if (userAnswers.includes(idealStack[i])) {
                    score += 10; 
                } else if (!userAnswers.includes("none")) {
                    userAnswers.forEach(ans => {
                        if (
                            (i === 0 && idealStack[1] === ans) || 
                            (i === 1 && idealStack[0] === ans) ||
                            (i === 2 && idealStack[3] === ans) ||
                            (i === 3 && idealStack[2] === ans) ||
                            (i === 4 && idealStack[5] === ans) ||
                            (i === 5 && idealStack[4] === ans) ||
                            (i === 6 && idealStack[7] === ans) ||
                            (i === 7 && idealStack[6] === ans)
                        ) {
                            score += 3;
                        }
                    });
                }
            }
            scores.push({ type: typeName, score: score, idealStack: idealStack, desc: typeInfo.desc });
        }

        // 降順ソート
        scores.sort((a, b) => b.score - a.score);

        // 同点の場合は同じ順位を付与する
        let currentRank = 1;
        scores[0].rank = 1;
        for (let i = 1; i < scores.length; i++) {
            if (scores[i].score === scores[i - 1].score) {
                scores[i].rank = currentRank;
            } else {
                currentRank = i + 1;
                scores[i].rank = currentRank;
            }
        }

        const list = document.getElementById("ranking-list");
        list.innerHTML = "";
        scores.forEach(item => {
            const li = document.createElement("li");
            li.innerHTML = `<span>${item.rank}位: ${item.type}</span> <span>${item.score}pt</span>`;
            list.appendChild(li);
        });

        const bestMatchScore = scores[0].score;
        const topTies = scores.filter(s => s.score === bestMatchScore);
        
        let subtypeMsg = "";
        let gasSubtypeStr = "";

        // 同率1位が複数ある場合
        if (topTies.length > 1) {
            subtypeMsg = `<i class="fa-solid fa-triangle-exclamation"></i> <strong>同順位のタイプが複数あります！</strong><br>選択肢が分散しているか、同じ回答を選びすぎている可能性があります。何度か試してしっくりくるタイプを見つけてね！`;
            gasSubtypeStr = "同率1位多数";
            document.getElementById("type-desc-section").classList.add("hidden");
        } else {
            // 単独1位の場合
            document.getElementById("type-desc-section").classList.remove("hidden");
            const bestMatch = scores[0];
            document.getElementById("type-description").textContent = bestMatch.desc;

            subtypeMsg = `判定された基本タイプは <strong>${bestMatch.type}</strong> です！<br>`;
            const demonstrativeFunc = bestMatch.idealStack[7]; 
            const ignoringFunc = bestMatch.idealStack[6];      

            let isDemonstrativeTop = false;
            let isIgnoringTop = false;
            for(let i=0; i<4; i++){
                if(userStack[i].includes(demonstrativeFunc)) isDemonstrativeTop = true;
                if(userStack[i].includes(ignoringFunc)) isIgnoringTop = true;
            }
            
            if (isDemonstrativeTop) {
                subtypeMsg += `<br><i class="fa-solid fa-bolt"></i> <strong>サブタイプ： ${bestMatch.type.split(" ")[0]}-${demonstrativeFunc} 検出！</strong><br>証明機能（${demonstrativeFunc}）を本来よりもゴリゴリに信頼して使っています！`;
                gasSubtypeStr = `${bestMatch.type.split(" ")[0]}-${demonstrativeFunc} サブタイプ`;
            } else if (isIgnoringTop) {
                subtypeMsg += `<br><i class="fa-solid fa-bolt"></i> <strong>サブタイプ： ${bestMatch.type.split(" ")[0]}-${ignoringFunc} 検出！</strong><br>無視機能（${ignoringFunc}）をあえて強く使おうとする独特なバランスです！`;
                gasSubtypeStr = `${bestMatch.type.split(" ")[0]}-${ignoringFunc} サブタイプ`;
            } else {
                subtypeMsg += `<br>機能のバランスはかなり王道的！THE・${bestMatch.type} という感じです！`;
                gasSubtypeStr = "王道バランス";
            }
        }

        document.getElementById("subtype-result").innerHTML = subtypeMsg;
        resultScreen.classList.remove("hidden");

        // ★★★ GASへのデータ送信処理（メール用データ作成） ★★★
        if (GAS_WEBAPP_URL !== "ここに_GASのURLを_貼り付ける" && GAS_WEBAPP_URL !== "") {
            const bestMatchTypeName = topTies.length > 1 ? "同率複数" : scores[0].type;
            
            // メール本文用に「選んだ履歴」を整形する
            let historyText = "";
            for (let i = 0; i < 8; i++) {
                const funcNames = userStack[i].includes("none") ? "ピンとこない" : userStack[i].join(", ");
                historyText += `【${blocks[i].name}】: ${funcNames}\n`;
            }

            // メール本文用に「全ランキング」を整形する
            let rankingText = "";
            scores.forEach(item => {
                rankingText += `${item.rank}位: ${item.type} (${item.score}pt)\n`;
            });

            // GASへ送るデータのまとまり
            const payload = {
                selfType: selfType,
                bestMatch: bestMatchTypeName,
                subtypeMsg: gasSubtypeStr.replace(/<[^>]*>?/gm, ''), // HTMLタグ消去
                userStack: userStack,
                historyText: historyText,
                rankingText: rankingText
            };

            // ★ ここを修正！(mode: "no-cors" を追加してセキュリティブロックを回避)
            fetch(GAS_WEBAPP_URL, {
                method: "POST",
                mode: "no-cors", // ←これが超重要！！
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(payload)
            }).then(() => {
                console.log("GAS(メール)送信リクエスト完了！");
            }).catch(error => {
                console.error("GAS送信エラー:", error);
            });
        }
    }

    // 画像保存 (html2canvas)
    document.getElementById("save-img-btn").addEventListener("click", () => {
        const noCaptureElements = document.querySelectorAll(".no-capture");
        noCaptureElements.forEach(el => el.style.display = "none");
        
        html2canvas(document.getElementById("capture-area"), {
            backgroundColor: "#1e1e2e", scale: 2
        }).then(canvas => {
            noCaptureElements.forEach(el => el.style.display = "");
            
            const imgData = canvas.toDataURL("image/png");
            
            // 端末がスマホかPCかを判定
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            
            if (isMobile) {
                // スマホの場合はモーダルを表示して長押し保存させる
                const modal = document.getElementById("image-modal");
                document.getElementById("generated-image").src = imgData;
                modal.classList.remove("hidden");
            } else {
                // PCの場合は直接ダウンロード
                const link = document.createElement("a");
                link.download = "socionics_result.png";
                link.href = imgData;
                link.click();
            }
        });
    });

    // モーダルを閉じる処理
    const closeModalBtn = document.getElementById("close-modal-btn");
    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", () => {
            document.getElementById("image-modal").classList.add("hidden");
        });
    }

    // シェア機能 (Web Share API)
    document.getElementById("share-btn").addEventListener("click", () => {
        const topRankText = document.getElementById("ranking-list").firstChild.innerText;
        const shareText = `私のソシオニクス診断結果は\n【${topRankText}】でした！\n#モデルA超詳細診断 #ソシオニクス\nあなたも診断してみてね！ ${window.location.href}`;
        
        if (navigator.share) {
            navigator.share({ 
                title: "モデルA 超詳細診断", 
                text: shareText, 
                url: window.location.href 
            }).catch(console.error);
        } else {
            showToast("お使いのブラウザはシェア機能に対応していません😭 結果をスクショしてね！");
        }
    });

    // 初期状態のナビゲーション設定
    updateTopNav("start");
});
