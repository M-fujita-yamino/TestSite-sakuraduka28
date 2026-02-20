// photo-search.js

// ★重要：ご自身でデプロイしたGASのURLに書き換えてください
const API_URL = "https://script.google.com/macros/s/AKfycbzcgLakCxMpq5Vgahc6smu_IfNChtrGnAgo5LCDlu6ljHiyaUyG8SZHSdFPV6rkFoObzA/exec"; 

export async function initPhotoSearch() {
    const classSelect = document.getElementById('classSelect');
    const searchInput = document.getElementById('searchInput');
    const searchResult = document.getElementById('searchResult');

    if (!classSelect || !searchInput || !searchResult) return;

    try {
        searchResult.innerHTML = '<p style="text-align:center;">名簿データを読み込み中...</p>';
        
        // GAS（スプレッドシート）からデータをフェッチ
        const response = await fetch(API_URL);
        const members = await response.json();

        const performSearch = () => {
            const classVal = classSelect.value;
            const searchVal = searchInput.value.toLowerCase().trim();
            searchResult.innerHTML = '';

            const filtered = members.filter(m => {
                const matchClass = !classVal || [String(m.c1), String(m.c2), String(m.c3)].includes(classVal);
                const matchText = !searchVal || (m.name + m.kana).includes(searchVal);
                return matchClass && matchText;
            });

            if (filtered.length === 0) {
                searchResult.innerHTML = '<p style="text-align:center; padding:20px; color:#999;">該当者は見つかりませんでした。</p>';
                return;
            }

            filtered.forEach(m => {
                const div = document.createElement('div');
                div.className = 'result-item';
                
                // 性別（sex列）を見てアイコンを出し分け
                let sexIcon = '';
                if (m.sex === '女') sexIcon = '🌸';
                else if (m.sex === '男') sexIcon = '🔹';

                let buttonsHtml = '<div class="class-btn-group">';
                if(m.link1 && m.link1.startsWith('http')) buttonsHtml += `<a href="${m.link1}" class="class-btn" target="_blank">1年 ${m.c1}</a>`;
                if(m.link2 && m.link2.startsWith('http')) buttonsHtml += `<a href="${m.link2}" class="class-btn" target="_blank">2年 ${m.c2}</a>`;
                if(m.link3 && m.link3.startsWith('http')) buttonsHtml += `<a href="${m.link3}" class="class-btn" target="_blank">3年 ${m.c3}</a>`;
                buttonsHtml += '</div>';

                const subject = encodeURIComponent(`【名簿訂正依頼】${m.name}さんについて`);
                div.innerHTML = `
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span class="result-name">${sexIcon} ${m.name} <span style="font-size:0.8em; color:#777;">(${m.kana})</span></span>
                        <a href="mailto:?subject=${subject}" style="font-size:11px; color:#888; text-decoration:underline;">⚠️ 訂正依頼</a>
                    </div>
                    ${buttonsHtml}`;
                searchResult.appendChild(div);
            });
        };

        classSelect.addEventListener('change', performSearch);
        searchInput.addEventListener('input', performSearch);
        
        // 初回表示（全表示、または適宜絞り込み）
        performSearch();

    } catch (error) {
        searchResult.innerHTML = '<p style="color:red; text-align:center;">データの取得に失敗しました。<br>GASのURLと公開設定を確認してください。</p>';
        console.error("Fetch error:", error);
    }
}