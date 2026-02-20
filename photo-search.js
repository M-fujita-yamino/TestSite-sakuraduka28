/**
 * スプレッドシート連動 高機能検索機能モジュール
 */
export async function initPhotoSearch({ classSelectId, searchInputId, resultDivId }) {
    const classSelect = document.getElementById(classSelectId);
    const searchInput = document.getElementById(searchInputId);
    const resultDiv = document.getElementById(resultDivId);
    
    const GAS_URL = 'https://script.google.com/macros/s/AKfycby6MV7JyQt2R9Wapooo8ZXTZAa-qVhD2k-rx0DG40vr826TtDLvOimFI1Ncs3OnStzDoA/exec'; // あなたのURL

    let allData = [];

    // --- 【安全策】UIを動的に、かつデザインを崩さず追加 ---
    // 既に存在しない場合のみ、性別とソートのプルダウンを作成
    if (!document.getElementById('dynamicSexSelect')) {
        const controls = document.createElement('div');
        controls.style.cssText = "display: flex; gap: 8px; margin-top: 8px;";
        controls.innerHTML = `
            <select id="dynamicSexSelect" class="search-box" style="flex: 1; height: 40px; border-radius: 8px; border: 1px solid #87ceeb; background: white; padding: 0 10px;">
                <option value="">性別すべて</option>
                <option value="男">男性のみ</option>
                <option value="女">女性のみ</option>
            </select>
            <select id="dynamicSortSelect" class="search-box" style="flex: 1; height: 40px; border-radius: 8px; border: 1px solid #87ceeb; background: white; padding: 0 10px;">
                <option value="kana_asc">五十音 (あ→ん)</option>
                <option value="kana_desc">五十音 (ん→あ)</option>
                <option value="class_asc">クラス順</option>
            </select>
        `;
        // 入力フォームの親要素の末尾に追加（崩れ防止）
        searchInput.parentNode.parentNode.appendChild(controls);
    }

    const sexSelect = document.getElementById('dynamicSexSelect');
    const sortSelect = document.getElementById('dynamicSortSelect');

    // データ取得（JSONP方式 - さっき成功した方式を維持）
    async function fetchData() {
        try {
            resultDiv.innerHTML = '<div style="color:#666; padding:10px;">名簿を読み込み中...</div>';
            const callbackName = 'cb_' + Date.now();
            window[callbackName] = (data) => {
                onDataReceived(data);
                delete window[callbackName];
            };
            const script = document.createElement('script');
            script.src = `${GAS_URL}?callback=${callbackName}`;
            document.body.appendChild(script);
        } catch (e) {
            resultDiv.innerHTML = '通信エラーが発生しました';
        }
    }

    function onDataReceived(rawData) {
        if (!rawData || rawData.length < 2) return;
        // データのマッピング（理系的に厳密に定義）
        allData = rawData.slice(1).map(r => ({
            name: String(r[0] || "").trim(),
            kana: String(r[1] || "").trim(),
            sex:  String(r[2] || "").trim(),
            c1:   String(r[3] || "").trim(),
            c2:   String(r[4] || "").trim(),
            c3:   String(r[5] || "").trim(),
            l1:   r[6], l2: r[7], l3: r[8]
        }));
        resultDiv.innerHTML = '<div style="color:#999; padding:10px;">同期完了しました。</div>';
    }

    function updateSearch() {
        const selC = classSelect.value;
        const selS = sexSelect.value;
        const query = searchInput.value.trim();
        const sort = sortSelect.value;

        // 【根本解決】「全クラス」の定義を広義に取る（空、undefined、全クラスという文字）
        const isAllClass = (!selC || selC === "全クラス");

        let filtered = allData.filter(item => {
            // 1. クラス絞り込み（全クラスなら常にパス）
            const matchC = isAllClass || (item.c1 === selC || item.c2 === selC || item.c3 === selC);
            // 2. 性別絞り込み
            const matchS = !selS || (item.sex === selS);
            // 3. 名前・カナ絞り込み
            const matchQ = !query || (item.name.includes(query) || item.kana.includes(query));
            
            return matchC && matchS && matchQ;
        });

        // ソート処理
        filtered.sort((a, b) => {
            if (sort === 'kana_asc') return a.kana.localeCompare(b.kana, 'ja');
            if (sort === 'kana_desc') return b.kana.localeCompare(a.kana, 'ja');
            const keyA = (a.c1 || "9") + (a.c2 || "9") + (a.c3 || "9");
            const keyB = (b.c1 || "9") + (b.c2 || "9") + (b.c3 || "9");
            return keyA.localeCompare(keyB);
        });

        renderResults(filtered, isAllClass ? "" : selC);
    }

    function renderResults(data, activeClass) {
        resultDiv.innerHTML = "";
        if (data.length === 0) {
            resultDiv.innerHTML = '<div style="color:#999; padding:10px;">該当する同期生は見つかりませんでした</div>';
            return;
        }

        data.forEach(m => {
            const div = document.createElement('div');
            div.className = 'result-item'; // CSSを適用
            
            // クラスバッジの作成（選択したクラスをピンクに）
            const buildBadge = (val, label) => {
                if (!val) return "";
                const isTarget = (val === activeClass);
                const bg = isTarget ? "#ff8da1" : "#87ceeb";
                return `<span class="class-btn" style="background:${bg}; border:none;">${label} ${val}</span>`;
            };

            div.innerHTML = `
                <div style="width:100%">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="result-name">${m.name} <small style="color:#888; font-weight:normal;">(${m.kana})</small></span>
                        <span style="font-size:0.8em; color:#999;">${m.sex}</span>
                    </div>
                    <div class="class-btn-container" style="margin-top:8px;">
                        ${buildBadge(m.c1, '1年')}${buildBadge(m.c2, '2年')}${buildBadge(m.c3, '3年')}
                    </div>
                </div>`;
            resultDiv.appendChild(div);
        });
    }

    // イベント登録をまとめる
    [classSelect, searchInput, sexSelect, sortSelect].forEach(el => {
        el.oninput = el.onchange = updateSearch;
    });

    fetchData();
}
