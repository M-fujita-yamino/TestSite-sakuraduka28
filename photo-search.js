/**
 * スプレッドシート連動 高機能検索機能モジュール
 */
export async function initPhotoSearch({ classSelectId, searchInputId, resultDivId }) {
    const classSelect = document.getElementById(classSelectId);
    const searchInput = document.getElementById(searchInputId);
    const resultDiv = document.getElementById(resultDivId);

    // GASのウェブアプリURL（デプロイ後に発行されるURLに書き換えてください）
    const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzcgLakCxMpq5Vgahc6smu_IfNChtrGnAgo5LCDlu6ljHiyaUyG8SZHSdFPV6rkFoObzA/exec';

    let allData = [];

    // --- UIの追加構築（性別・ソート用） ---
    // 既存の検索エリアにコントロールを追加
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

    // データ読み込み
    async function fetchData() {
        try {
            resultDiv.innerHTML = '<div style="color:#666; padding:10px;">データを同期中...</div>';
            const response = await fetch(GAS_ENDPOINT);
            if (!response.ok) throw new Error('Network response was not ok');
            allData = await response.json();
            resultDiv.innerHTML = '<div style="color:#999; padding:10px;">名簿の読み込みが完了しました</div>';
        } catch (error) {
            console.error('Fetch error:', error);
            resultDiv.innerHTML = '<div style="color:#d65f82; padding:10px;">データの取得に失敗しました。GASのURLを確認してください。</div>';
        }
    }

    // 検索・絞り込み・ソート実行
    function updateSearch() {
        const selectedClass = classSelect.value; // "1-1", "3-5" など
        const query = searchInput.value.trim();
        const selectedSex = sexSelect.value;
        const sortType = sortSelect.value;

        // 何も指定されていない場合は結果をクリア（または全件表示にするならここを調整）
        if (!selectedClass && !query && !selectedSex) {
            resultDiv.innerHTML = '<div style="color:#999; padding:10px;">クラスを選択するか、名前を入力してください</div>';
            return;
        }

        // 1. フィルタリング（絞り込み）
        let filtered = allData.filter(item => {
            // クラス絞り込み (c1, c2, c3のいずれかに合致するか)
            let matchClass = true;
            if (selectedClass) {
                matchClass = (item.c1 === selectedClass || item.c2 === selectedClass || item.c3 === selectedClass);
            }
            
            // 名前・フリガナ絞り込み
            let matchName = true;
            if (query) {
                matchName = (item.name.includes(query) || item.kana.includes(query));
            }

            // 性別絞り込み
            let matchSex = true;
            if (selectedSex) {
                matchSex = (item.sex === selectedSex);
            }

            return matchClass && matchName && matchSex;
        });

        // 2. ソート（並べ替え）
        filtered.sort((a, b) => {
            if (sortType === 'kana_asc') {
                return a.kana.localeCompare(b.kana, 'ja');
            } else if (sortType === 'kana_desc') {
                return b.kana.localeCompare(a.kana, 'ja');
            } else if (sortType === 'class_asc') {
                // クラス順（1年＞2年＞3年の優先度で比較）
                return (a.c1 + a.c2 + a.c3).localeCompare(b.c1 + b.c2 + b.c3);
            }
            return 0;
        });

        renderResults(filtered, selectedClass);
    }

    // 結果表示
    function renderResults(data, selectedClass) {
        resultDiv.innerHTML = '';
        if (data.length === 0) {
            resultDiv.innerHTML = '<div style="color:#999; padding:10px;">該当する同期生は見つかりませんでした</div>';
            return;
        }

        const countDiv = document.createElement('div');
        countDiv.style.cssText = "font-size:12px; color:#005a80; margin-bottom:10px; font-weight:bold;";
        countDiv.textContent = `検索結果: ${data.length}名`;
        resultDiv.appendChild(countDiv);

        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'result-item';
            div.style.borderLeft = '4px solid #87ceeb';
            
            // クラス情報のバッジ作成（検索したクラスを強調）
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
                <div style="display:flex; flex-direction:column; gap:4px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span class="result-name">${item.name} 
                            <span style="font-size:0.7em; color:#777; font-weight:normal;">(${item.kana})</span>
                        </span>
                        <span style="font-size:0.8em; color:#999;">[${item.sex || '-'}]</span>
                    </div>
                    <div class="class-btn-container" style="margin-top:5px;">
                        ${badges}
                    </div>
                </div>
            `;
            resultDiv.appendChild(div);
        });
    }

    // イベントリスナー登録
    [classSelect, searchInput, sexSelect, sortSelect].forEach(el => {
        el.addEventListener('change', updateSearch);
        el.addEventListener('input', updateSearch);
    });

    // 初回データ取得
    fetchData();
}
