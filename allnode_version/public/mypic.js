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

    const targetOrigin = window.location.origin;

    GM_addStyle(`
        #note-image-wrapper {
            position: fixed;
            top: 20px;
            right: 74px; /* 避开日记助手按钮 */
            z-index: 10001;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }

        #image-toggle-btn {
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
            position: relative; /* 为角标提供基准 */
            z-index: 1000;
        }

        #image-badge {
            position: absolute;
            top: -6px;
            right: -6px;
            background: #ff4757;
            color: white;
            font-size: 10px;
            font-weight: 800;
            min-width: 18px;
            height: 18px;
            border-radius: 9px;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 0 4px;
            box-shadow: 0 2px 8px rgba(255, 71, 87, 0.4);
            border: 2px solid #fff;
            animation: badgePop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            line-height: 1;
        }

        @keyframes badgePop {
            from { transform: scale(0); }
            to { transform: scale(1); }
        }

        #image-toggle-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
            background: #fff;
        }

        #image-toggle-btn.active {
            background: #ff9800;
            color: white;
            border-color: #ff9800;
        }

        #image-container {
            margin-top: 12px;
            width: 320px;
            max-height: 500px;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.5);
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
            padding: 15px;
            display: none;
            flex-direction: column;
            overflow-y: auto;
            transform-origin: top right;
            animation: imgScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes imgScaleIn {
            from { opacity: 0; transform: scale(0.8) translateY(-10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }

        #image-container.show {
            display: flex;
        }

        .image-box-title {
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 12px;
            color: #333;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .manage-pics-btn {
            font-size: 11px;
            padding: 2px 8px;
            background: #ff9800;
            color: white;
            border-radius: 6px;
            text-decoration: none;
            transition: opacity 0.2s;
        }

        .manage-pics-btn:hover {
            opacity: 0.8;
        }

        .note-image-item {
            width: 100%;
            border-radius: 10px;
            margin-bottom: 12px;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .note-image-item:hover {
            transform: scale(1.03);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }

        .no-image-hint {
            text-align: center;
            color: #999;
            padding: 20px;
            font-size: 13px;
        }

        /* 深色模式适配 */
        #note-image-wrapper.dark-mode #image-toggle-btn {
            background-color: #444;
            color: #fff;
        }

        #note-image-wrapper.dark-mode #image-container {
            background: rgba(30, 30, 30, 0.85);
            border-color: rgba(255, 255, 255, 0.1);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
        }

        #note-image-wrapper.dark-mode .image-box-title {
            color: #eee;
        }
    `);

    // 获取当前选中的标识符（从输入框中获取，去除 .txt 后缀）
    function getCurrentIdentifier() {
        const input = document.getElementById('fileName');
        if (input && input.value) {
            return input.value.replace(/\.txt$/i, '');
        }
        return null;
    }

    // 更新并显示图片角标
    async function updateImageBadge() {
        const idStr = getCurrentIdentifier();
        const badge = document.getElementById('image-badge');
        if (!idStr || !badge) {
            if (badge) badge.style.display = 'none';
            return;
        }

        try {
            const response = await fetch(`${targetOrigin}/api/getImageList/${idStr}`);
            if (response.ok) {
                const list = await response.json();
                if (list && list.length > 0) {
                    badge.innerText = list.length > 99 ? '99+' : list.length;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            } else {
                badge.style.display = 'none';
            }
        } catch (err) {
            badge.style.display = 'none';
        }
    }

    // 获取并显示图片
    async function fetchAndShowImages(idStr) {
        const container = document.getElementById('image-container');
        if (!idStr) {
            container.innerHTML = `<div class="no-image-hint">请先在文件名框输入内容</div>`;
            return;
        }

        container.innerHTML = `<div class="image-box-title">
                <span>${idStr}</span>
                <a href="t2.html?box=${idStr}" class="manage-pics-btn">管理图片 ↗</a>
            </div><div class="no-image-hint">加载中...</div>`;

        try {
            const response = await fetch(`${targetOrigin}/api/getImageList/${idStr}`);
            if (!response.ok) throw new Error('Network response was not ok');

            const list = await response.json();
            container.innerHTML = `<div class="image-box-title">
                <span>${idStr} (${list.length})</span>
                <a href="t2.html?box=${idStr}" class="manage-pics-btn">管理图片 ↗</a>
            </div>`;

            if (list.length === 0) {
                container.innerHTML += `<div class="no-image-hint">该分类无图片记录</div>`;
                updateImageBadge(); // 同步角标状态
                return;
            }

            // 更新角标状态
            updateImageBadge();

            list.forEach(fileName => {
                const img = document.createElement('img');
                img.className = 'note-image-item';
                img.src = `${targetOrigin}/images/${idStr}/${fileName}`;
                img.loading = 'lazy';
                img.onclick = () => window.open(img.src, '_blank');
                container.appendChild(img);
            });
        } catch (err) {
            container.innerHTML = `<div class="image-box-title"><span>${idStr}</span></div><div class="no-image-hint">获取图片列表失败</div>`;
            console.error(err);
        }
    }

    function updateDarkMode() {
        const isDark = localStorage.getItem('darkMode') === 'true';
        const wrapper = document.getElementById('note-image-wrapper');
        if (wrapper) {
            wrapper.classList.toggle('dark-mode', isDark);
        }
    }

    // 初始化界面
    const wrapper = document.createElement('div');
    wrapper.id = 'note-image-wrapper';

    const imageBtn = document.createElement('div');
    imageBtn.id = 'image-toggle-btn';
    imageBtn.innerHTML = '<i class="fas fa-image"></i>';
    imageBtn.title = '载入当前文件对应图片';

    const badge = document.createElement('div');
    badge.id = 'image-badge';
    imageBtn.appendChild(badge);

    const imgContainer = document.createElement('div');
    imgContainer.id = 'image-container';

    imageBtn.addEventListener('click', () => {
        const isShow = imgContainer.classList.toggle('show');
        imageBtn.classList.toggle('active', isShow);
        if (isShow) {
            fetchAndShowImages(getCurrentIdentifier());
        }
    });

    wrapper.appendChild(imageBtn);
    wrapper.appendChild(imgContainer);
    document.body.appendChild(wrapper);

    // 点击外部关闭
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            imgContainer.classList.remove('show');
            imageBtn.classList.remove('active');
        }
    });

    // 监听输入框变化，同步更新角标和图片列表
    const fileNameInput = document.getElementById('fileName');
    if (fileNameInput) {
        const syncImages = () => {
            const id = getCurrentIdentifier();
            updateImageBadge(); // 无论是否显示弹窗，始终更新角标
            if (imgContainer.classList.contains('show')) {
                fetchAndShowImages(id);
            }
        };

        fileNameInput.addEventListener('change', syncImages);
        fileNameInput.addEventListener('input', syncImages); // 实时输入时也尝试更新（防抖由浏览器的频率控制）

        fileNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                setTimeout(syncImages, 100);
            }
        });
    }

    // 初始应用深色模式并更新角标
    updateDarkMode();
    updateImageBadge();
    setInterval(updateDarkMode, 1000);

    // 轮询检查角标（针对文件名切换频繁的情况）
    setInterval(updateImageBadge, 3000);

})();
