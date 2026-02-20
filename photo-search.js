export async function initPhotoSearch({ classSelectId, searchInputId, resultDivId }) {
    const classSelect = document.getElementById(classSelectId);
    const searchInput = document.getElementById(searchInputId);
    const resultDiv = document.getElementById(resultDivId);
    
    // HTMLに追加した新しいIDを取得
    const sexSelect = document.getElementById('sexSelect');
    const sortSelect = document.getElementById('sortSelect');
    
    const GAS_URL = 'https://script.google.com/macros/s/AKfycby6MV7JyQt2R9Wapooo8ZXTZAa-qVhD2k-rx0DG40vr826TtDLvOimFI1Ncs3OnStzDoA/exec'; // URLを貼る
    let allData = [];

    // データ取得（JSONP）
    async function fetchData() {
        resultDiv.innerHTML = '同期中...';
        const callbackName = 'callback_' + Date.now();
        window[callbackName] = (data) => {
            allData = data.slice(1).map(r => ({
                name: String(r[0]||""), kana: String(r[1]||""), sex: String(r[2]||""),
                c1: String(r[3]||""), c2: String(r[4]||""), c3: String(r[5]||""),
                l1: r[6], l2: r[7], l3: r[8]
            }));
            resultDiv.innerHTML = '同期完了。条件を選んでください。';
            delete window[callbackName];
        };
        const s = document.createElement('script');
        s.src = `${GAS_URL}?callback=${callbackName}`;
        document.body.appendChild(s);
    }

    function updateSearch() {
        const valC = classSelect.value;
        const valS = sexSelect.value;
        const valQ = searchInput.value.trim();
        const sort  = sortSelect.value;

        // 全クラス時はクラス判定をスルーする
        const isAll = (valC === "" || valC === "全クラス");

        let filtered = allData.filter(item => {
            const mC = isAll || (item.c1===valC || item.c2===valC || item.c3===valC);
            const mS = !valS || (item.sex === valS);
            const mQ = !valQ || (item.name.includes(valQ) || item.kana.includes(valQ));
            return mC && mS && mQ;
        });

        // 並び替え
        filtered.sort((a, b) => {
            if (sort === 'kana_asc') return a.kana.localeCompare(b.kana, 'ja');
            if (sort === 'kana_desc') return b.kana.localeCompare(a.kana, 'ja');
            return (a.c1+a.c2+a.c3).localeCompare(b.c1+b.c2+b.c3);
        });

        // 表示
        resultDiv.innerHTML = filtered.length ? "" : "該当者は見つかりませんでした";
        filtered.forEach(item => {
            const div = document.createElement('div');
            div.className = 'result-item';
            div.innerHTML = `
                <div style="width:100%">
                    <div style="display:flex; justify-content:space-between;">
                        <b>${item.name}</b> <small>${item.sex}</small>
                    </div>
                    <div style="margin-top:5px;">
                        <span class="class-btn" style="${item.c1===valC?'background:#ff8da1':''}">${item.c1}</span>
                        <span class="class-btn" style="${item.c2===valC?'background:#ff8da1':''}">${item.c2}</span>
                        <span class="class-btn" style="${item.c3===valC?'background:#ff8da1':''}">${item.c3}</span>
                    </div>
                </div>`;
            resultDiv.appendChild(div);
        });
    }

    // イベント登録（すべての要素に対して）
    [classSelect, searchInput, sexSelect, sortSelect].forEach(el => {
        if(el) el.onchange = el.oninput = updateSearch;
    });

    fetchData();
}
