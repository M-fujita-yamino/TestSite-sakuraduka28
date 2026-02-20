/**
 * スプレッドシート連動 高機能検索機能モジュール
 */
export async function initPhotoSearch({ classSelectId, searchInputId, resultDivId }) {
    const classSelect = document.getElementById(classSelectId);
    const searchInput = document.getElementById(searchInputId);
    const resultDiv = document.getElementById(resultDivId);
    
    // ★ご自身のGAS URLをここに貼り付け
    const GAS_URL = 'https://script.google.com/macros/s/AKfycby6MV7JyQt2R9Wapooo8ZXTZAa-qVhD2k-rx0DG40vr826TtDLvOimFI1Ncs3OnStzDoA/exec';

    let allData = [];

    // --- UIの自動構築（性別・ソート） ---
    const searchArea = document.getElementById('dynamic-search-area');
    if (searchArea && !document.getElementById('dynamicSexSelect')) {
        const controlsWrap = document.createElement('div');
        controlsWrap.style.cssText = "display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; align-items: center;";
        controlsWrap.innerHTML = `
            <select id="dynamicSexSelect" class="search-box" style="width: 30%; min-width: 100px; border-color: #87ceeb;">
                <option value="">性別すべて</option>
                <option value="男">男性</option>
                <option value="女">女性</option>
            </select>
            <select id="dynamicSortSelect" class="search-box" style="flex: 1; min-width: 150px; border-color: #87ceeb;">
                <option value="kana_asc">五十音順 (あ→ん)</option>
                <option value="kana_desc">五十音順 (ん→あ)</option>
                <option value="class_asc">クラス順</option>
            </select>
        `;
        const container = searchArea.querySelector('div');
        if (container) container.after(controlsWrap);
    }

    const sexSelect = document.getElementById('dynamicSexSelect');
    const sortSelect = document.getElementById('dynamicSortSelect');

    // データ取得
    async function fetchData() {
        try {
            resultDiv.innerHTML = '<div style="color:#666;">データを同期中...</div>';
            const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
            const script = document.createElement('script');
            window[callbackName] = function(data) {
                delete window[callbackName];
                document.body.removeChild(script);
                onDataReceived(data);
            };
            script.src = `${GAS_URL}?callback=${callbackName}`;
            document.body.appendChild(script);
        } catch (error) {
            resultDiv.innerHTML = '<div style="color:red;">同期エラー</div>';
        }
    }

    function onDataReceived(rawData) {
        if (!rawData || rawData.length < 2) return;
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
        resultDiv.innerHTML = '<div style="color:#999;">同期完了。</div>';
    }

    function updateSearch() {
        // 現在の選択値を取得
        const rawClass = classSelect.value;
        const query = searchInput.value.trim().toLowerCase();
        const selSex = sexSelect ? sexSelect.value : "";
        const sortType = sortSelect ? sortSelect.value : "kana_asc";

        // 「全クラス」や「未選択」の状態を判定する（理系的な厳密判定）
        // 選択肢のvalueが ""（空）や "全クラス" の場合は絞り込みをしない
        const isAllClass = (rawClass === "" || rawClass === "全クラス");

        let filtered = allData.filter(item => {
            // 1. クラス判定
            const matchClass = isAllClass || (item.c1 === rawClass || item.c2 === rawClass || item.c3 === rawClass);
            
            // 2. 名前/カナ判定
            const matchName = !query || (item.name.toLowerCase().includes(query) || item.kana.includes(query));
            
            // 3. 性別判定
            const matchSex = !selSex || (item.sex === selSex);

            return matchClass && matchName && matchSex;
        });

        // ソート処理
        filtered.sort((a, b) => {
            if (sortType === 'kana_asc') return a.kana.localeCompare(b.kana, 'ja');
            if (sortType === 'kana_desc') return b.kana.localeCompare(a.kana, 'ja');
            if (sortType === 'class_asc') {
                const aKey = (a.c1 || "9-9") + (a.c2 || "9-9") + (a.c3 || "9-9");
                const bKey = (b.c1 || "9-9") + (b.c2 || "9-9") + (b.c3 || "9-9");
                return aKey.localeCompare(bKey);
            }
            return 0;
        });

        renderResults(filtered, isAllClass ? "" : rawClass);
    }

    function renderResults(data, activeClass) {
        resultDiv.innerHTML = '';
        if (data.length === 0) {
            resultDiv.innerHTML = '<div style="color:#d65f82; padding:10px;">該当者は見つかりませんでした</div>';
            return;
        }

        const countDiv = document.createElement('div');
        countDiv.style.cssText = "font-size:13px; color:#005a80; margin-bottom:10px; font-weight:bold;";
        countDiv.textContent = `検索結果: ${data.length}名`;
        resultDiv.appendChild(countDiv);

        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'result-item';
            let badges = '';
            [{l:'1年',v:item.c1,lk:item.link1},{l:'2年',v:item.c2,lk:item.link2},{l:'3年',v:item.c3,lk:item.link3}].forEach(c => {
                if(c.v) {
                    const isTarget = (c.v === activeClass);
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
                        <span style="font-size:0.85em; color:#bbb;">${item.sex}</span>
                    </div>
                    <div class="class-btn-container" style="margin-top:8px;">${badges}</div>
                </div>`;
            resultDiv.appendChild(div);
        });
    }

    // イベント登録
    [classSelect, searchInput, sexSelect, sortSelect].forEach(el => {
        if (el) {
            el.addEventListener('change', updateSearch);
            el.addEventListener('input', updateSearch);
        }
    });

    fetchData();
}
