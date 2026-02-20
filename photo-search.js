/**
 * スプレッドシート連動 検索機能モジュール
 */
export async function initPhotoSearch({ classSelectId, searchInputId, resultDivId }) {
    const classSelect = document.getElementById(classSelectId);
    const searchInput = document.getElementById(searchInputId);
    const resultDiv = document.getElementById(resultDivId);

    // GASのウェブアプリURL（デプロイ後に発行されるURLに書き換えてください）
    const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzcgLakCxMpq5Vgahc6smu_IfNChtrGnAgo5LCDlu6ljHiyaUyG8SZHSdFPV6rkFoObzA/exec';

    let allData = [];

    // データ読み込み
    async function fetchData() {
        try {
            resultDiv.innerHTML = '<div style="color:#666; padding:10px;">データを読み込み中...</div>';
            const response = await fetch(GAS_ENDPOINT);
            allData = await response.json();
            resultDiv.innerHTML = '<div style="color:#999; padding:10px;">検索の準備ができました</div>';
        } catch (error) {
            console.error('Fetch error:', error);
            resultDiv.innerHTML = '<div style="color:#d65f82; padding:10px;">データの取得に失敗しました</div>';
        }
    }

    // 検索実行
    function updateSearch() {
        const selectedClass = classSelect.value;
        const query = searchInput.value.trim();

        if (!selectedClass && !query) {
            resultDiv.innerHTML = '';
            return;
        }

        const filtered = allData.filter(item => {
            const matchClass = selectedClass ? (item.class === selectedClass) : true;
            const matchName = query ? (item.name.includes(query) || item.kana.includes(query)) : true;
            return matchClass && matchName;
        });

        renderResults(filtered);
    }

    function renderResults(data) {
        resultDiv.innerHTML = '';
        if (data.length === 0) {
            resultDiv.innerHTML = '<div style="color:#999; padding:10px;">見つかりませんでした</div>';
            return;
        }

        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'result-item';
            div.style.borderLeftColor = '#87ceeb'; // スプレッドシート版は青色で区別
            
            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="result-name">${item.name} <span style="font-size:0.8em; color:#777;">(${item.kana})</span></span>
                </div>
                <div class="class-btn-container">
                    <a href="${item.link}" class="class-btn" target="_blank" style="background:#87ceeb;">写真をみる</a>
                </div>
            `;
            resultDiv.appendChild(div);
        });
    }

    classSelect.addEventListener('change', updateSearch);
    searchInput.addEventListener('input', updateSearch);

    // 初回データ取得
    fetchData();
}
