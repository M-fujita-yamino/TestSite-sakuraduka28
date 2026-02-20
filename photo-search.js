// photo-search.js (修正版)
const API_URL = "https://script.google.com/macros/s/AKfycbzcgLakCxMpq5Vgahc6smu_IfNChtrGnAgo5LCDlu6ljHiyaUyG8SZHSdFPV6rkFoObzA/exec"; 

export async function initPhotoSearch() {
    const classSelect = document.getElementById('classSelect');
    const searchInput = document.getElementById('searchInput');
    const searchResult = document.getElementById('searchResult');

    try {
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
                
                // 性別アイコン（sex列がある場合）
                let sexIcon = m.sex === '女' ? '🌸 ' : (m.sex === '男' ? '🔹 ' : '');

                // オリジナルの「訂正依頼」メールリンクを完全再現
                const subject = encodeURIComponent(`【名簿訂正依頼】${m.name}さんについて`);
                const body = encodeURIComponent(`管理者様\n\n訂正をお願いします。対象：${m.name}`);
                const mailLink = `mailto:?subject=${subject}&body=${body}`;
                const fixBtn = `<a href="${mailLink}" style="font-size:11px; color:#888; text-decoration:underline;">⚠️ 訂正依頼</a>`;

                let buttonsHtml = '<div class="class-btn-group">';
                if(m.link1?.startsWith('http')) buttonsHtml += `<a href="${m.link1}" class="class-btn" target="_blank">1年 ${m.c1}</a>`;
                if(m.link2?.startsWith('http')) buttonsHtml += `<a href="${m.link2}" class="class-btn" target="_blank">2年 ${m.c2}</a>`;
                if(m.link3?.startsWith('http')) buttonsHtml += `<a href="${m.link3}" class="class-btn" target="_blank">3年 ${m.c3}</a>`;
                buttonsHtml += '</div>';

                div.innerHTML = `
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span class="result-name">${sexIcon}${m.name} <span style="font-size:0.8em; color:#777;">(${m.kana})</span></span>
                        ${fixBtn}
                    </div>
                    ${buttonsHtml}`;
                searchResult.appendChild(div);
            });
        };

        classSelect.addEventListener('change', performSearch);
        searchInput.addEventListener('input', performSearch);
        performSearch(); // 初回表示実行

    } catch (e) {
        console.error("API Error:", e);
    }
}
