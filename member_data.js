// スプレッドシートの公開CSV URL
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTzLqpB8e6tiN06L-urFd1agctJ6JiLfJQW...'; 

let memberData = [];

async function fetchMemberData() {
    try {
        const response = await fetch(SPREADSHEET_URL);
        const csvText = await response.text();
        
        // 1行目はヘッダー、かつ空行を除外して処理
        const rows = csvText.split('\n').slice(1);
        
        memberData = rows
            .filter(row => row.trim() !== "") // 空行を除外
            .map(row => {
                const cols = row.split(',');
                return {
                    name: cols[0],
                    kana: cols[1],
                    c1: cols[3], link1: cols[6],
                    c2: cols[4], link2: cols[7],
                    c3: cols[5], link3: cols[8]
                };
            });
        console.log("データ読み込み完了: " + memberData.length + "名");
    } catch (e) {
        console.error("データ読み込み失敗", e);
    }
}

// ページ読み込み時に実行
fetchMemberData();
