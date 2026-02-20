/**
 * スプレッドシート連動 高機能検索機能モジュール
 */
export async function initPhotoSearch({ classSelectId, searchInputId, resultDivId }) {
    const classSelect = document.getElementById(classSelectId);
    const searchInput = document.getElementById(searchInputId);
    const resultDiv = document.getElementById(resultDivId);
    
    // ★ご自身のGAS URL（デプロイ済み）をここに貼り付け
    const GAS_URL = 'https://script.google.com/macros/s/AKfycby6MV7JyQt2R9Wapooo8ZXTZAa-qVhD2k-rx0DG40vr826TtDLvOimFI1Ncs3OnStzDoA/exec';

    let allData = [];

    // --- UIの自動構築（性別・ソート用） ---
    const searchArea = document.getElementById('dynamic-search-area');
    const controlsWrap = document.createElement('div');
    controlsWrap.style.cssText = "display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; align-items: center;";

    controlsWrap.innerHTML = `
        <select id="dynamicSexSelect" class="search-box" style="width: 30%; min-width: 100px; border-color: #87ceeb; cursor: pointer;">
            <option value="">性別すべて</option>
            <option value="男">男性のみ</option>
            <option value="女">女性のみ</option>
        </select>
        <select id="dynamicSortSelect" class="search-box" style="flex: 1; min-width: 150px; border-color: #87ceeb; cursor: pointer;">
            <option value="kana_asc">五十音順 (あ→ん)</option>
            <option value="kana_desc">五十音順 (ん→あ)</option>
            <option value="class_asc">クラス順 (1年→3年)</option>
        </select>
    `;
    // クラス選択・名前入力のすぐ下に追加
    searchArea.querySelector('div').after(controlsWrap);

    const sexSelect = document.getElementById('dynamicSexSelect');
    const sortSelect = document.getElementById('dynamicSortSelect');

    // データ取得（JSONP方式）
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
            resultDiv.innerHTML = '<div style="color:red;">通信エラーが発生しました</div>';
        }
    }

    function onDataReceived(rawData) {
        if (!rawData || rawData.length < 2) {
            resultDiv.innerHTML = '<div style="color:red;">データが見つかりません。</div>';
            return;
        }

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

        resultDiv.innerHTML = '<div style="color:#999;">同期完了。クラスや条件を選んでください。</div>';
    }

    // 検索・フィルタリング・ソートの統合処理
    function updateSearch() {
        const selClass = classSelect.value;
        const query = searchInput.value.trim();
        const selSex = sexSelect.value;
        const sortType = sortSelect.value;
        
        if (!selClass && !query && !selSex) {
            resultDiv.innerHTML = '<div style="color:#999;">条件を選択してください</div>';
            return;
        }

        // 1. 絞り込み
        let filtered = allData.filter(item => {
            const matchClass = selClass ? (item.c1 === selClass || item.c2 === selClass || item.c3 === selClass) : true;
            const matchName = query ? (item.name.includes(query) || item.kana.includes(query)) : true;
            const matchSex = selSex ? (item.sex === selSex) : true;
            return matchClass && matchName && matchSex;
        });

        // 2. 並べ替え
        filtered.sort((a, b) => {
            if (sortType === 'kana_asc') {
                return a.kana.localeCompare(b.kana, 'ja');
            } else if (sortType === 'kana_desc') {
                return b.kana.localeCompare(a.kana, 'ja');
            } else if (sortType === 'class_asc') {
                // 1年→2年→3年の順で文字列結合して比較
                const classA = (a.c1 || "z") + (a.c2 || "z") + (a.c3 || "z");
                const classB = (b.c1 || "z") + (b.c2 || "z") + (b.c3 || "z");
                return classA.localeCompare(classB);
            }
            return 0;
        });

        renderResults(filtered, selClass);
    }

    function renderResults(data, selClass) {
        resultDiv.innerHTML = '';
        if (data.length === 0) {
            resultDiv.innerHTML = '<div style="color:#d65f82; padding:10px;">該当者は見つかりませんでした</div>';
            return;
        }

        const countDiv = document.createElement('div');
        countDiv.style.cssText = "font-size:12px; color:#005a80; margin: 10px 0; font-weight:bold;";
        countDiv.textContent = `ヒット: ${data.length}名`;
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

    // すべてのコントロールにイベントを設定
    [classSelect, searchInput, sexSelect, sortSelect].forEach(el => {
        el.addEventListener('change', updateSearch);
        el.addEventListener('input', updateSearch);
    });

    fetchData();
}
