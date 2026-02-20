export async function initPhotoSearch({ classSelectId, searchInputId, resultDivId }) {
    const classSelect = document.getElementById(classSelectId);
    const searchInput = document.getElementById(searchInputId);
    const resultDiv = document.getElementById(resultDivId);
    const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxhyr6MVsW6XJBH1tK_rMk7gnAy4dQArG5ikuk9ixaIJz9r6_E4LY7wTw_CmDJMdhp1EQ/exec';

    let allData = [];

    // データの読み込み
    async function fetchData() {
        try {
            resultDiv.innerHTML = 'データを読み込み中...';
            const response = await fetch(GAS_ENDPOINT);
            if (!response.ok) throw new Error('通信エラー');
            const rawData = await response.json();

            // データの整形（列番号: 0:名前, 1:カナ, 2:性別, 3:c1, 4:c2, 5:c3...）
            allData = rawData.slice(1).map(row => ({
                name: String(row[0] || ""),
                kana: String(row[1] || ""),
                sex:  String(row[2] || ""),
                c1:   String(row[3] || "").trim(), // クラス名をトリミングして完全一致させる
                c2:   String(row[4] || "").trim(),
                c3:   String(row[5] || "").trim(),
                link1: row[6] || "",
                link2: row[7] || "",
                link3: row[8] || ""
            }));
            resultDiv.innerHTML = '読み込み完了。クラスを選択してください。';
        } catch (e) {
            resultDiv.innerHTML = '取得失敗。GASの公開設定を確認してください。';
        }
    }

    function updateSearch() {
        const selClass = classSelect.value; // "1-1" など
        const query = searchInput.value.trim();

        const filtered = allData.filter(item => {
            // クラス検索のロジック（c1, c2, c3のいずれかに選択したクラスがあるか）
            const matchClass = selClass ? (item.c1 === selClass || item.c2 === selClass || item.c3 === selClass) : true;
            const matchName = query ? (item.name.includes(query) || item.kana.includes(query)) : true;
            return matchClass && matchName;
        });

        renderResults(filtered, selClass);
    }

    function renderResults(data, selClass) {
        resultDiv.innerHTML = "";
        if (data.length === 0) {
            resultDiv.innerHTML = '<div style="color:red;">該当する同期生は見つかりませんでした</div>';
            return;
        }

        data.forEach(m => {
            const div = document.createElement('div');
            div.className = 'result-item';
            // 検索したクラスをピンク、それ以外を水色で表示
            const b1 = m.c1 ? `<span class="class-btn" style="${m.c1===selClass?'background:#ff8da1':''}">${m.c1}</span>` : "";
            const b2 = m.c2 ? `<span class="class-btn" style="${m.c2===selClass?'background:#ff8da1':''}">${m.c2}</span>` : "";
            const b3 = m.c3 ? `<span class="class-btn" style="${m.c3===selClass?'background:#ff8da1':''}">${m.c3}</span>` : "";
            
            div.innerHTML = `
                <div style="width:100%">
                    <div class="result-name">${m.name} <small>(${m.kana})</small></div>
                    <div class="class-btn-container">${b1}${b2}${b3}</div>
                </div>`;
            resultDiv.appendChild(div);
        });
    }

    classSelect.addEventListener('change', updateSearch);
    searchInput.addEventListener('input', updateSearch);
    fetchData();
}
