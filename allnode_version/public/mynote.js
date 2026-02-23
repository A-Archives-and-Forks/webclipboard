(function () {
    'use strict';

    // Fallback for GM_addStyle if not running as a userscript
    if (typeof GM_addStyle === 'undefined') {
        window.GM_addStyle = function (css) {
            const style = document.createElement('style');
            style.textContent = css;
            document.head.appendChild(style);
        };
    }

    // --- 配置区 ---
    // 默认自动获取当前页面的 IP/域名。如果需要跨域请求特定 IP，请修改此处。
    const targetOrigin = window.location.origin;
    // --------------

    // 样式注入：包含玻璃拟态效果、标记样式和过渡动画
    GM_addStyle(`
        #note-calendar-wrapper {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }

        #calendar-toggle-btn {
            width: 40px;
            height: 40px;
            background: #fafafa;
            color: rgb(86, 86, 86);
            border: none;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 20px;
            user-select: none;
            z-index: 1000;
        }

        #calendar-toggle-btn:hover {
            transform: scale(1.1);
        }

        #calendar-toggle-btn.active {
            background: #eee;
            color: #2575fc;
        }

        #calendar-container {
            margin-top: 12px;
            width: 300px;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.5);
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
            padding: 20px;
            display: none;
            flex-direction: column;
            transform-origin: top right;
            animation: calScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes calScaleIn {
            from { opacity: 0; transform: scale(0.8) translateY(-10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }

        #calendar-container.show {
            display: flex;
        }

        .cal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .cal-title {
            font-weight: 700;
            font-size: 16px;
            color: #1d1d1f;
        }

        .cal-nav {
            display: flex;
            gap: 8px;
        }

        .cal-nav-btn {
            width: 28px;
            height: 28px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.2s;
            color: #555;
            font-size: 14px;
            border: 1px solid rgba(0,0,0,0.05);
        }

        .cal-nav-btn:hover {
            background: rgba(0, 0, 0, 0.05);
        }

        .cal-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 5px;
        }

        .cal-day-label {
            text-align: center;
            font-size: 11px;
            font-weight: 600;
            color: #999;
            padding-bottom: 8px;
            text-transform: uppercase;
        }

        .cal-date {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            cursor: pointer;
            font-size: 13px;
            color: #444;
            transition: all 0.2s;
            position: relative;
        }

        .cal-date:hover:not(.empty) {
            background: #f0f4ff;
            color: #2575fc;
            font-weight: 600;
        }

        .cal-date.today {
            background: rgba(37, 117, 252, 0.05);
            color: #2575fc;
            font-weight: 700;
            box-shadow: inset 0 0 0 1px rgba(37, 117, 252, 0.3);
        }

        /* 有日记的日期样式 */
        .cal-date.has-note {
            background: #e1f5fe;
            color: #0288d1;
            font-weight: 600;
        }

        .cal-date.has-note::after {
            content: '';
            position: absolute;
            bottom: 4px;
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: #0288d1;
        }

        .cal-date.selected {
            background: #2575fc !important;
            color: white !important;
            box-shadow: 0 4px 10px rgba(37, 117, 252, 0.3);
        }

        .cal-date.empty {
            cursor: default;
        }

        /* --- 深色模式样式 --- */
        #note-calendar-wrapper.dark-mode #calendar-toggle-btn {
            background-color: #444;
            color: #fff;
        }

        #note-calendar-wrapper.dark-mode #calendar-container {
            background: rgba(30, 30, 30, 0.85);
            border-color: rgba(255, 255, 255, 0.1);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
        }

        #note-calendar-wrapper.dark-mode .cal-title {
            color: #eee;
        }

        #note-calendar-wrapper.dark-mode .cal-nav-btn {
            color: #bbb;
            border-color: rgba(255, 255, 255, 0.1);
        }

        #note-calendar-wrapper.dark-mode .cal-nav-btn:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        #note-calendar-wrapper.dark-mode .cal-date {
            color: #ccc;
        }

        #note-calendar-wrapper.dark-mode .cal-date:hover:not(.empty) {
            background: rgba(37, 117, 252, 0.2);
            color: #fff;
        }

        #note-calendar-wrapper.dark-mode .cal-date.today {
            background: rgba(37, 117, 252, 0.15);
            box-shadow: inset 0 0 0 1px rgba(37, 117, 252, 0.5);
        }

        #note-calendar-wrapper.dark-mode .cal-date.has-note {
            background: rgba(2, 136, 209, 0.2);
            color: #29b6f6;
        }

        #note-calendar-wrapper.dark-mode .cal-date.has-note::after {
            background: #29b6f6;
        }

        #note-calendar-wrapper.dark-mode .cal-day-label {
            color: #666;
        }
    `);

    let currentNavDate = new Date();
    const today = new Date();

    function formatDate(year, month, day) {
        const y = year;
        const m = String(month + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // 检查当月所有日期是否有日记
    async function checkNotesForMonth(year, month) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const baseApiUrl = `${targetOrigin}/api/readfile/`;

        // 记录当前的渲染版本，防止异步回调覆盖了新月份的 UI
        const currentId = `${year}-${month}`;

        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = formatDate(year, month, i);
            const url = `${baseApiUrl}${dateStr}.txt`;

            fetch(url).then(async response => {
                if (response.ok) {
                    const text = await response.text();
                    if (text.trim() !== 'file not found') {
                        // 确保我们还在展示同一个月份
                        const renderTitle = document.getElementById('calendar-title').getAttribute('data-id');
                        if (renderTitle === currentId) {
                            const dateEl = document.querySelector(`.cal-date[data-day="${i}"]`);
                            if (dateEl) {
                                dateEl.classList.add('has-note');
                            }
                        }
                    }
                }
            }).catch(err => console.error(`Check failed for ${dateStr}:`, err));
        }
    }

    function renderCalendar() {
        const year = currentNavDate.getFullYear();
        const month = currentNavDate.getMonth();

        const grid = document.getElementById('calendar-grid');
        const title = document.getElementById('calendar-title');

        const currentId = `${year}-${month}`;
        title.innerText = `${year}年 ${month + 1}月`;
        title.setAttribute('data-id', currentId);
        grid.innerHTML = '';

        // 星期标签
        ['日', '一', '二', '三', '四', '五', '六'].forEach(day => {
            const div = document.createElement('div');
            div.className = 'cal-day-label';
            div.innerText = day;
            grid.appendChild(div);
        });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // 填充空白
        for (let i = 0; i < firstDay; i++) {
            const div = document.createElement('div');
            div.className = 'cal-date empty';
            grid.appendChild(div);
        }

        // 填充日期
        for (let i = 1; i <= daysInMonth; i++) {
            const div = document.createElement('div');
            div.className = 'cal-date';
            div.innerText = i;
            div.setAttribute('data-day', i);

            if (year === today.getFullYear() && month === today.getMonth() && i === today.getDate()) {
                div.classList.add('today');
            }

            div.addEventListener('click', () => {
                const dateStr = formatDate(year, month, i);
                navigateToDate(dateStr);

                document.querySelectorAll('.cal-date').forEach(d => d.classList.remove('selected'));
                div.classList.add('selected');
            });

            grid.appendChild(div);
        }

        // 渲染完 UI 后，异步检查笔记存在情况
        checkNotesForMonth(year, month);
    }

    function navigateToDate(dateStr) {
        const input = document.getElementById('fileName');
        if (input) {
            input.value = `${dateStr}.txt`;

            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));

            // 模拟 Enter 按下
            const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
            });
            input.dispatchEvent(enterEvent);

            // 兜底事件触发
            input.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', keyCode: 13, bubbles: true }));
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', keyCode: 13, bubbles: true }));

            console.log(`Navigating to: ${dateStr}.txt`);
        } else {
            alert('未找到 ID 为 fileName 的输入框');
        }
    }

    // 深色模式检测
    function updateDarkMode() {
        const isDark = localStorage.getItem('darkMode') === 'true';
        const wrapper = document.getElementById('note-calendar-wrapper');
        if (wrapper) {
            wrapper.classList.toggle('dark-mode', isDark);
        }
    }

    // 初始化界面
    const wrapper = document.createElement('div');
    wrapper.id = 'note-calendar-wrapper';

    const toggleBtn = document.createElement('div');
    toggleBtn.id = 'calendar-toggle-btn';
    toggleBtn.innerHTML = '<i class="fas fa-calendar-alt"></i>';
    toggleBtn.title = '打开/关闭日历';

    const calContainer = document.createElement('div');
    calContainer.id = 'calendar-container';
    calContainer.innerHTML = `
        <div class="cal-header">
            <div id="calendar-title" class="cal-title"></div>
            <div class="cal-nav">
                <div id="cal-prev" class="cal-nav-btn">＜</div>
                <div id="cal-next" class="cal-nav-btn">＞</div>
            </div>
        </div>
        <div id="calendar-grid" class="cal-grid"></div>
    `;

    toggleBtn.addEventListener('click', () => {
        const isShow = calContainer.classList.toggle('show');
        toggleBtn.classList.toggle('active', isShow);
        if (isShow) renderCalendar();
    });

    wrapper.appendChild(toggleBtn);
    wrapper.appendChild(calContainer);
    document.body.appendChild(wrapper);

    // 绑定翻页事件
    wrapper.querySelector('#cal-prev').addEventListener('click', (e) => {
        e.stopPropagation();
        currentNavDate.setMonth(currentNavDate.getMonth() - 1);
        renderCalendar();
    });

    wrapper.querySelector('#cal-next').addEventListener('click', (e) => {
        e.stopPropagation();
        currentNavDate.setMonth(currentNavDate.getMonth() + 1);
        renderCalendar();
    });

    // 点击外部关闭
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            calContainer.classList.remove('show');
            toggleBtn.classList.remove('active');
        }
    });

    // 初始应用深色模式并持续监听（防止页面内切换模式不刷新）
    updateDarkMode();
    setInterval(updateDarkMode, 1000);

})();
