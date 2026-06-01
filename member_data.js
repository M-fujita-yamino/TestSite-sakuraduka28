// スプレッドシートの公開CSV URL
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTzLqpB8e6tiN06L-urFd1agctJ6JIlfJQW-JcybZ_VrVYOh7D9uwk6PlIlO8wCpcQKVyUKRJOnchn-/pub?gid=0&single=true&output=csv';

let memberData = [];

async function fetchMemberData() {
    try {
        const response = await fetch(SPREADSHEET_URL);
        const csvText = await response.text();
        
        // CSVを配列に変換（1行目はヘッダーと仮定）
        const rows = csvText.split('\n').slice(1);
        memberData = rows.map(row => {
            const cols = row.split(',');
            // スプレッドシートの列順に合わせてインデックスを調整してください
            // 例: 名前(0), カナ(1), c1(2), link1(3), c2(4), link2(5), c3(6), link3(7)
            return {
                name: cols[0],
                kana: cols[1],
                c1: cols[2], link1: cols[3],
                c2: cols[4], link2: cols[5],
                c3: cols[6], link3: cols[7]
            };
        });
        console.log("データ読み込み完了");
    } catch (e) {
        console.error("データ読み込み失敗", e);
    }
}

// ページ読み込み時に実行
fetchMemberData();
