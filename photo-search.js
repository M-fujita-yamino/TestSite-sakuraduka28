export async function initPhotoSearch({ classSelectId, searchInputId, resultDivId }) {
    const container = document.getElementById('dynamic-search-area');
    const resultDiv = document.getElementById(resultDivId);
    const GAS_URL = 'https://script.google.com/macros/s/AKfycby6MV7JyQt2R9Wapooo8ZXTZAa-qVhD2k-rx0DG40vr826TtDLvOimFI1Ncs3OnStzDoA/exec'; // あなたのURL

    // --- 1. UIの強制生成（デザイン崩れを防ぐため一括生成） ---
    container.innerHTML = `
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <select id="classSelect" class="search-box" style="flex: 1; min-width: 140px;">
                <option value="">全クラス</option>
                ${Array.from({length:10}, (_, i) => `<option value="1-${i+1}">1-${i+1}</option>`).join('')}
                ${Array.from({length:10}, (_, i) => `<option value="2-${i+1}">2-${i+1}</option>`).join('')}
                ${Array.from({length:10}, (_, i) => `<option value="3-${i+1}">3-${i+1}</option>`).join('')}
            </select>
            <input type="text" id="searchInput" class="search-box" placeholder="名前・カナ検索" style="flex: 1; min-width: 140px;">
        </div>
        <div style="display: flex; gap: 10px; margin-top: 10px;">
            <select id="sexSelect" class="search-box" style="width: 35%;">
                <option value="">性別すべて</option>
                <option value="男">男性</option>
                <option value="女">女性</option>
            </select>
            <select id="sortSelect" class="search-box" style="flex: 1;">
                <option value="kana_asc">五十音(あ→ん)</option>
                <option value="kana_desc">五十音(ん→あ)</option>
                <option value="class_asc">クラス順</option>
            </select>
        </div>
    `;

    // 生成した要素を再取得
    const classSelect = document.getElementById('classSelect');
    const searchInput = document.getElementById('searchInput');
    const sexSelect = document.getElementById('sexSelect');
    const sortSelect = document.getElementById('sortSelect');

    let allData = [];

    // --- 2. データ取得（JSONP） ---
    async function fetchData() {
        resultDiv.innerHTML = '<div style="padding:20px; color:#666;">データを同期しています...</div>';
        const cb = 'cb_' + Date.now();
        window[cb] = (data) => {
            allData = data.slice(1).map(r => ({
                name: String(r[0]||""), kana: String(r[1]||""), sex: String(r[2]||""),
                c1: String(r[3]||""), c2: String(r[4]||""), c3: String(r[5]||"")
            }));
            resultDiv.innerHTML = '<div style="padding:10px; color:#999;">同期が完了しました。</div>';
            delete window[cb];
        };
        const s = document.createElement('script');
        s.src = `${GAS_URL}?callback=${cb}`;
        document.body.appendChild(s);
    }

    // --- 3. 検索ロジック ---
    function updateSearch() {
        const valC = classSelect.value;
        const valS = sexSelect.value;
        const valQ = searchInput.value.trim();
        const sort = sortSelect.value;

        let filtered = allData.filter(item => {
            const mC = (!valC) || (item.c1===valC || item.c2===valC || item.c3===valC);
            const mS = (!valS) || (item.sex === valS);
            const mQ = (!valQ) || (item.name.includes(valQ) || item.kana.includes(valQ));
            return mC && mS && mQ;
        });

        // ソート
        filtered.sort((a, b) => {
            if (sort === 'kana_asc') return a.kana.localeCompare(b.kana, 'ja');
            if (sort === 'kana_desc') return b.kana.localeCompare(a.kana, 'ja');
            const keyA = (a.c1||"9")+(a.c2||"9")+(a.c3||"9");
            const keyB = (b.c1||"9")+(b.c2||"9")+(b.c3||"9");
            return keyA.localeCompare(keyB);
        });

        // --- 4. 結果表示 ---
        resultDiv.innerHTML = "";
        if (!filtered.length && (valC || valS || valQ)) {
            resultDiv.innerHTML = '<div style="padding:20px; color:#d65f82;">該当者は見つかりませんでした</div>';
            return;
        }

        filtered.forEach(item => {
            const div = document.createElement('div');
            div.className = 'result-item'; // CSSに依存
            div.innerHTML = `
                <div style="width:100%">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:bold; color:#333;">${item.name} <small style="font-weight:normal; color:#888;">(${item.kana})</small></span>
                        <span style="font-size:0.8em; color:#aaa;">${item.sex}</span>
                    </div>
                    <div style="margin-top:8px; display:flex; gap:5px;">
                        ${item.c1 ? `<span class="class-btn" style="${item.c1===valC?'background:#ff8da1':'background:#87ceeb'}">1年 ${item.c1}</span>` : ''}
                        ${item.c2 ? `<span class="class-btn" style="${item.c2===valC?'background:#ff8da1':'background:#87ceeb'}">2年 ${item.c2}</span>` : ''}
                        ${item.c3 ? `<span class="class-btn" style="${item.c3===valC?'background:#ff8da1':'background:#87ceeb'}">3年 ${item.c3}</span>` : ''}
                    </div>
                </div>`;
            resultDiv.appendChild(div);
        });
    }

    // イベント登録
    [classSelect, searchInput, sexSelect, sortSelect].forEach(el => {
        el.oninput = el.onchange = updateSearch;
    });

    fetchData();
}
