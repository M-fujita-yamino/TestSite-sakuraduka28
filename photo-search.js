/**
 * スプレッドシート連動 高機能検索機能モジュール
 */
export async function initPhotoSearch({ classSelectId, searchInputId, resultDivId }) {
    const classSelect = document.getElementById(classSelectId);
    const searchInput = document.getElementById(searchInputId);
    const resultDiv = document.getElementById(resultDivId);

    // GASのウェブアプリURL（ご自身のURLに書き換えてください）
    const GAS_ENDPOINT = 'https://script.google.com/macros/s/YOUR_DEPLOY_ID/exec';

    let allData = [];

    // --- UIの追加構築（性別・ソート用） ---
    const searchArea = document.getElementById('dynamic-search-area');
    const controlsWrap = document.createElement('div');
    controlsWrap.style.cssText = "display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; align-items: center;";

    controlsWrap.innerHTML = `
        <select id="dynamicSexSelect" class="search-box" style="width: 25%; min-width: 100px; border-color: #87ceeb;">
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
    searchArea.querySelector('div').after(controlsWrap);

    const sexSelect = document.getElementById('dynamicSexSelect');
    const sortSelect = document.getElementById('dynamicSortSelect');

    // データ読み込みと成形
    async function fetchData() {
        try {
            resultDiv.innerHTML = '<div style="color:#666; padding:10px;">データを同期中...</div>';
            const response = await fetch(GAS_ENDPOINT);
            const rawData = await response.json();

            // スプレッドシートの配列をオブジェクト形式に変換
            // スプレッドシートの並び：name(0), kana(1), sex(2), c1(3), c2(4), c3(5), link1(6), link2(7), link3(8)
            allData = rawData.slice(1).map(row => ({
                name:  row[0] || "",
                kana:  row[1] || "",
                sex:   row[2] || "",
                c1:    String(row[3] || ""),
                c2:    String(row[4] || ""),
                c3:    String(row[5] || ""),
                link1: row[6] || "",
                link2: row[7] || "",
                link3: row[8] || ""
            }));

            resultDiv.innerHTML = '<div style="color:#999; padding:10px;">名簿の読み込みが完了しました</div>';
        } catch (error) {
            console.error('Fetch error:', error);
            resultDiv.innerHTML = '<div style="color:#d65f82; padding:10px;">データの取得に失敗しました。</div>';
        }
    }

    function updateSearch() {
        const selectedClass = classSelect.value;
        const query = searchInput.value.trim();
        const selectedSex = sexSelect.value;
        const sortType = sortSelect.value;

        if (!selectedClass && !query && !selectedSex) {
            resultDiv.innerHTML = '<div style="color:#999; padding:10px;">クラスを選択するか、名前を入力してください</div>';
            return;
        }

        let filtered = allData.filter(item => {
            // クラス検索：c1, c2, c3のいずれかが選択値と一致するか
            let matchClass = true;
            if (selectedClass) {
                matchClass = (item.c1 === selectedClass || item.c2 === selectedClass || item.c3 === selectedClass);
            }
            
            let matchName = true;
            if (query) {
                matchName = (item.name.includes(query) || item.kana.includes(query));
            }

            let matchSex = true;
            if (selectedSex) {
                matchSex = (item.sex === selectedSex);
            }

            return matchClass && matchName && matchSex;
        });

        // ソート
        filtered.sort((a, b) => {
            if (sortType === 'kana_asc') return a.kana.localeCompare(b.kana, 'ja');
            if (sortType === 'kana_desc') return b.kana.localeCompare(a.kana, 'ja');
            if (sortType === 'class_asc') return (a.c1 + a.c2 + a.c3).localeCompare(b.c1 + b.c2 + b.c3);
            return 0;
        });

        renderResults(filtered, selectedClass);
    }

    function renderResults(data, selectedClass) {
        resultDiv.innerHTML = '';
        if (data.length === 0) {
            resultDiv.innerHTML = '<div style="color:#999; padding:10px;">該当者は見つかりませんでした</div>';
            return;
        }

        const countDiv = document.createElement('div');
        countDiv.style.cssText = "font-size:12px; color:#005a80; margin-bottom:10px; font-weight:bold;";
        countDiv.textContent = `該当: ${data.length}名`;
        resultDiv.appendChild(countDiv);

        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'result-item';
            
            let badges = '';
            const cList = [
                {label: '1年', val: item.c1, link: item.link1},
                {label: '2年', val: item.c2, link: item.link2},
                {label: '3年', val: item.c3, link: item.link3}
            ];

            cList.forEach(c => {
                if (c.val) {
                    const isTarget = (c.val === selectedClass);
                    const style = isTarget ? 'background:#ff8da1; border:1px solid #ff8da1;' : 'background:#87ceeb;';
                    if (c.link && c.link.startsWith('http')) {
                        badges += `<a href="${c.link}" class="class-btn" target="_blank" style="${style}">${c.label} ${c.val}</a>`;
                    } else {
                        badges += `<span class="class-btn" style="${style} opacity:0.6; cursor:default;">${c.label} ${c.val}</span>`;
                    }
                }
            });

            div.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:4px; width:100%;">
                    <div style="display:flex; align-items:center; justify-content:space-between;">
                        <span class="result-name">${item.name} 
                            <span style="font-size:0.7em; color:#777; font-weight:normal;">(${item.kana})</span>
                        </span>
                        <span style="font-size:0.8em; color:#999;">${item.sex || ''}</span>
                    </div>
                    <div class="class-btn-container" style="margin-top:5px;">${badges}</div>
                </div>
            `;
            resultDiv.appendChild(div);
        });
    }

    [classSelect, searchInput, sexSelect, sortSelect].forEach(el => {
        el.addEventListener('change', updateSearch);
        el.addEventListener('input', updateSearch);
    });

    fetchData();
}
