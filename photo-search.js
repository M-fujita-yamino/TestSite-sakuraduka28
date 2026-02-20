export async function initPhotoSearch({ classSelectId, searchInputId, resultDivId }) {
    const classSelect = document.getElementById(classSelectId);
    const searchInput = document.getElementById(searchInputId);
    const resultDiv = document.getElementById(resultDivId);
    
    // ★新しいデプロイURLをここに貼り付け
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbzuZHyoRgNtrLdBy49VhvA5aIKo3iHqJnZMUnSz9LQ6wocJU5MKtAyihQbvLWNGYf4XSQ/exec';

    let allData = [];

    // JSONPでデータを取得する関数（CORSエラーが起きません）
    async function fetchData() {
        try {
            resultDiv.innerHTML = '<div style="color:#666;">データを同期中...</div>';
            
            const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
            const script = document.createElement('script');
            
            // グローバルスコープにコールバック関数を定義
            window[callbackName] = function(data) {
                delete window[callbackName];
                document.body.removeChild(script);
                onDataReceived(data);
            };

            script.src = `${GAS_URL}?callback=${callbackName}`;
            document.body.appendChild(script);

        } catch (error) {
            resultDiv.innerHTML = '<div style="color:red;">通信エラーが発生しました</div>';
        }
    }

    function onDataReceived(rawData) {
        if (!rawData || rawData.length < 2) {
            resultDiv.innerHTML = '<div style="color:red;">データが空、またはスプレッドシートが正しく読み込めませんでした</div>';
            return;
        }

        // データの成形（0:name, 1:kana, 2:sex, 3:c1, 4:c2, 5:c3, 6:link1, 7:link2, 8:link3）
        allData = rawData.slice(1).map(row => ({
            name:  String(row[0] || "").trim(),
            kana:  String(row[1] || "").trim(),
            sex:   String(row[2] || "").trim(),
            c1:    String(row[3] || "").trim(), 
            c2:    String(row[4] || "").trim(),
            c3:    String(row[5] || "").trim(),
            link1: String(row[6] || "").trim(),
            link2: String(row[7] || "").trim(),
            link3: String(row[8] || "").trim()
        }));

        resultDiv.innerHTML = '<div style="color:#999;">同期完了。クラスを選択してください。</div>';
    }

    function updateSearch() {
        const selClass = classSelect.value;
        const query = searchInput.value.trim();
        
        if (!selClass && !query) {
            resultDiv.innerHTML = '<div style="color:#999;">クラスを選択するか、名前を入力してください</div>';
            return;
        }

        const filtered = allData.filter(item => {
            const matchClass = selClass ? (item.c1 === selClass || item.c2 === selClass || item.c3 === selClass) : true;
            const matchName = query ? (item.name.includes(query) || item.kana.includes(query)) : true;
            return matchClass && matchName;
        });

        renderResults(filtered, selClass);
    }

    function renderResults(data, selClass) {
        resultDiv.innerHTML = '';
        if (data.length === 0) {
            resultDiv.innerHTML = '<div style="color:#d65f82; padding:10px;">該当する同期生は見つかりませんでした</div>';
            return;
        }

        const countDiv = document.createElement('div');
        countDiv.style.cssText = "font-size:12px; color:#005a80; margin-bottom:10px; font-weight:bold;";
        countDiv.textContent = `検索結果: ${data.length}名`;
        resultDiv.appendChild(countDiv);

        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'result-item';
            
            let badges = '';
            [{l:'1年',v:item.c1,lk:item.link1},{l:'2年',v:item.c2,lk:item.link2},{l:'3年',v:item.c3,lk:item.link3}].forEach(c => {
                if(c.v) {
                    const isTarget = (c.v === selClass);
                    const style = isTarget ? 'background:#ff8da1; border:1px solid #ff8da1;' : 'background:#87ceeb;';
                    if (c.lk && c.lk.startsWith('http')) {
                        badges += `<a href="${c.lk}" target="_blank" class="class-btn" style="${style}">${c.l} ${c.v}</a>`;
                    } else {
                        badges += `<span class="class-btn" style="${style}">${c.l} ${c.v}</span>`;
                    }
                }
            });

            div.innerHTML = `
                <div style="width:100%">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="result-name">${item.name} <small style="font-weight:normal; color:#888;">(${item.kana})</small></span>
                        <span style="font-size:0.8em; color:#bbb;">${item.sex}</span>
                    </div>
                    <div class="class-btn-container" style="margin-top:5px;">${badges}</div>
                </div>`;
            resultDiv.appendChild(div);
        });
    }

    classSelect.addEventListener('change', updateSearch);
    searchInput.addEventListener('input', updateSearch);
    fetchData();
}
