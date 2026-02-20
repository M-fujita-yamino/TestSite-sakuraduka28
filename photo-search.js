/**
 * スプレッドシート連動 高機能検索機能モジュール
 */
export async function initPhotoSearch({ classSelectId, searchInputId, resultDivId }) {
    const classSelect = document.getElementById(classSelectId);
    const searchInput = document.getElementById(searchInputId);
    const resultDiv = document.getElementById(resultDivId);

    // ★ここに「新しいデプロイ」で発行されたURLを貼り付け
    const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycby6MV7JyQt2R9Wapooo8ZXTZAa-qVhD2k-rx0DG40vr826TtDLvOimFI1Ncs3OnStzDoA/exec';

    let allData = [];

    async function fetchData() {
        try {
            resultDiv.innerHTML = '<div style="color:#666;">データを同期中...</div>';
            // fetchに mode: 'cors' は不要（GASの場合は自動でリダイレクトされるため）
            const response = await fetch(GAS_ENDPOINT);
            if (!response.ok) throw new Error('Network response was not ok');
            const rawData = await response.json();

            // データの成形：列順 (0:name, 1:kana, 2:sex, 3:c1, 4:c2, 5:c3, 6:link1, 7:link2, 8:link3)
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

            resultDiv.innerHTML = '<div style="color:#999;">同期完了。検索可能です。</div>';
        } catch (error) {
            console.error('Fetch error:', error);
            resultDiv.innerHTML = '<div style="color:red;">データの取得に失敗しました。URLとデプロイ設定を確認してください。</div>';
        }
    }

    function updateSearch() {
        const selectedClass = classSelect.value;
        const query = searchInput.value.trim();
        
        if (!selectedClass && !query) {
            resultDiv.innerHTML = '<div style="color:#999;">クラスを選択するか、名前を入力してください</div>';
            return;
        }

        const filtered = allData.filter(item => {
            const matchClass = selectedClass ? (item.c1 === selectedClass || item.c2 === selectedClass || item.c3 === selectedClass) : true;
            const matchName = query ? (item.name.includes(query) || item.kana.includes(query)) : true;
            return matchClass && matchName;
        });

        renderResults(filtered, selectedClass);
    }

    function renderResults(data, selectedClass) {
        resultDiv.innerHTML = '';
        if (data.length === 0) {
            resultDiv.innerHTML = '<div style="color:#999;">該当する同期生は見つかりませんでした</div>';
            return;
        }

        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'result-item';
            
            // クラスバッジの生成
            let badges = '';
            const classes = [
                {label:'1年', val:item.c1, link:item.link1},
                {label:'2年', val:item.c2, link:item.link2},
                {label:'3年', val:item.c3, link:item.link3}
            ];

            classes.forEach(c => {
                if(c.val) {
                    const isTarget = (c.val === selectedClass);
                    const style = isTarget ? 'background:#ff8da1; border:1px solid #ff8da1;' : 'background:#87ceeb;';
                    const linkAttr = (c.link && c.link.startsWith('http')) ? `href="${c.link}" target="_blank"` : '';
                    const tag = linkAttr ? 'a' : 'span';
                    badges += `<${tag} ${linkAttr} class="class-btn" style="${style}">${c.label} ${c.val}</${tag}>`;
                }
            });

            div.innerHTML = `
                <div style="width:100%">
                    <div class="result-name">${item.name} <small>(${item.kana})</small></div>
                    <div class="class-btn-container" style="margin-top:5px;">${badges}</div>
                </div>`;
            resultDiv.appendChild(div);
        });
    }

    classSelect.addEventListener('change', updateSearch);
    searchInput.addEventListener('input', updateSearch);
    fetchData();
}
