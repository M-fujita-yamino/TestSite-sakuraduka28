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

    // --- UIの自動構築 ---
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
    
    const targetContainer = searchArea.querySelector('div');
    if (targetContainer) targetContainer.after(controlsWrap);

    const sexSelect = document.getElementById('dynamicSexSelect');
    const sortSelect = document.getElementById('dynamicSortSelect');

    // データ取得（JSONP方式）
    async function fetchData() {
        try {
            resultDiv.innerHTML = '<div style="color:#666; padding:10px;">データを同期中...</div>';
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
            resultDiv.innerHTML = '<div style="color:red; padding:10px;">同期に失敗しました</div>';
        }
    }

    function onDataReceived(rawData) {
        if (!rawData || rawData.length < 2) {
            resultDiv.innerHTML = '<div style="color:red; padding:10px;">データが空です</div>';
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

        resultDiv.innerHTML = '<div style="color:#999; padding:10px;">同期完了。検索を開始してください。</div>';
    }

    function updateSearch() {
        const selClass = classSelect.value;
        const query = searchInput.value.trim();
        const selSex = sexSelect.value;
        const sortType = sortSelect.value;
        
        // 何も指定されていない時は案内を表示（全クラスが選ばれている場合も含む）
        if (!selClass && !query && !selSex) {
            resultDiv.innerHTML = '<div style="color:#999; padding:10px;">クラスを選択するか、名前を入力してください</div>';
            return;
        }

        let filtered = allData.filter(item => {
            // クラス一致チェック：「全クラス（空値）」の時は常にtrue
            const matchClass = (!selClass) ? true : (item.c1 === selClass || item.c2 === selClass || item.c3 === selClass);
            // 名前・フリガナチェック
            const matchName = (!query) ? true : (item.name.includes(query) || item.kana.includes(query));
            // 性別チェック
            const matchSex = (!selSex) ? true : (item.sex === selSex);
            
            return matchClass && matchName && matchSex;
        });

        // ソート処理
        filtered.sort((a, b) => {
            if (sortType === 'kana_asc') return a.kana.localeCompare(b.kana, 'ja');
            if (sortType === 'kana_desc') return b.kana.localeCompare(a.kana, 'ja');
            if (sortType === 'class_asc') {
                const aVal = (a.c1 || "9-9") + (a.c2 || "9-9") + (a.c3 || "9-9");
                const bVal = (b.c1 || "9-9") + (b.c2 || "9-9") + (b.c3 || "9-9");
                return aVal.localeCompare(bVal);
            }
            return 0;
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
        countDiv.style.cssText = "font-size:13px; color:#005a80; margin: 10px 0; font-weight:bold;";
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
                        <span style="font-size:0.85em; color:#bbb; background:#f9f9f9; padding:2px 6px; border-radius:4px;">${item.sex}</span>
                    </div>
                    <div class="class-btn-container" style="margin-top:8px;">${badges}</div>
                </div>`;
            resultDiv.appendChild(div);
        });
    }

    [classSelect, searchInput, sexSelect, sortSelect].forEach(el => {
        el.addEventListener('change', updateSearch);
        el.addEventListener('input', updateSearch);
    });

    fetchData();
}
