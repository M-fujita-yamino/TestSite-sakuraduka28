export async function initPhotoSearch({ classSelectId, searchInputId, resultDivId }) {
    const classSelect = document.getElementById(classSelectId);
    const searchInput = document.getElementById(searchInputId);
    const resultDiv = document.getElementById(resultDivId);

    // GASのURLをここに貼り付けてください
    const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbz2Guv35L7CSTXiti25E6mHPFqJMpD0jS0P2G4WhOGxmKpdIeh0270OIJtgvWlEF3Ay_Q/exec';

    let allData = [];

    async function fetchData() {
        try {
            resultDiv.innerHTML = '通信中...';
            const response = await fetch(GAS_ENDPOINT);
            const rawData = await response.json();

            // 【デバッグ用】実際に届いている最初の1行を表示してみる
            resultDiv.innerHTML = `<div style="background:#eee; padding:10px; font-size:10px;">
                【デバッグ表示】1行目のデータ: ${JSON.stringify(rawData[1])}
            </div>`;

            allData = rawData.slice(1).map(row => ({
                name:  String(row[0] || ""),
                kana:  String(row[1] || ""),
                sex:   String(row[2] || ""),
                c1:    String(row[3] || ""),
                c2:    String(row[4] || ""),
                c3:    String(row[5] || ""),
                link1: String(row[6] || ""),
                link2: String(row[7] || ""),
                link3: String(row[8] || "")
            }));
        } catch (error) {
            resultDiv.innerHTML = 'エラー: ' + error;
        }
    }

    function updateSearch() {
        const selectedClass = classSelect.value;
        const query = searchInput.value.trim();
        
        // 検索ロジック
        const filtered = allData.filter(item => {
            const matchClass = selectedClass ? (item.c1 === selectedClass || item.c2 === selectedClass || item.c3 === selectedClass) : true;
            const matchName = query ? (item.name.includes(query) || item.kana.includes(query)) : true;
            return matchClass && matchName;
        });

        // 検索がヒットしなかった場合、何が原因かを表示する
        if (filtered.length === 0) {
            resultDiv.innerHTML += `<div style="color:red; margin-top:10px;">
                ヒットしません。選択中：${selectedClass} / スプレッドシート側の例：${allData[0]?.c1}
            </div>`;
        } else {
            resultDiv.innerHTML = `ヒットしました：${filtered.length}名`;
        }
    }

    classSelect.addEventListener('change', updateSearch);
    searchInput.addEventListener('input', updateSearch);
    fetchData();
}

