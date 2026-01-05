(async function() {
    console.log("🚀 脚本启动：开始【跨页】全自动评教...");

    window.onerror = function() { return true; };
    const sleep = (ms) => new Promise(r => setTimeout(r, ms + Math.random() * 100));

    async function hyperClick(el) {
        if (!el) return;
        try {
            el.scrollIntoView({ behavior: 'auto', block: 'center' });
            const rect = el.getBoundingClientRect();
            const opts = { bubbles: true, clientX: rect.left + rect.width/2, clientY: rect.top + rect.height/2, view: window };
            el.dispatchEvent(new MouseEvent('mouseover', opts));
            el.dispatchEvent(new PointerEvent('pointerdown', { ...opts, isPrimary: true }));
            el.dispatchEvent(new MouseEvent('mousedown', opts));
            await sleep(50);
            el.dispatchEvent(new PointerEvent('pointerup', { ...opts, isPrimary: true }));
            el.dispatchEvent(new MouseEvent('mouseup', opts));
            el.click();
        } catch (e) {}
    }

    function getDoc(selector) {
        if (document.querySelector(selector)) return document;
        const fs = document.getElementsByTagName("iframe");
        for (let f of fs) {
            try { if (f.contentDocument && f.contentDocument.querySelector(selector)) return f.contentDocument; } catch(e){}
        }
        return document;
    }

    // 主执行逻辑
    while (true) {
        let listDoc = getDoc("td");
        let allTds = listDoc.getElementsByTagName("td");
        let targetTr = null;

        // 1. 扫描当前页
        for (let td of allTds) {
            let txt = td.innerText.trim();
            if (txt.includes("未评") && td.parentElement.style.display !== 'none') {
                targetTr = td.parentElement;
                break;
            }
        }

        // 2. 如果当前页扫完了，尝试翻页
        if (!targetTr) {
            console.log("分页检查：当前页已无未评科目，尝试寻找【下一页】...");
            // 匹配你提供的图标按钮及其父级链接/按钮
            let nextBtn = listDoc.querySelector(".glyphicon-chevron-right")?.parentElement || 
                          listDoc.querySelector("a[title='下一页']") || 
                          listDoc.querySelector(".ui-icon-seek-next");

            if (nextBtn && !nextBtn.classList.contains('ui-state-disabled') && !nextBtn.parentElement.classList.contains('disabled')) {
                console.log("➡️ 发现下一页，正在跳转...");
                await hyperClick(nextBtn);
                await sleep(2000); // 等待翻页加载
                continue; // 重新进入循环扫描新页面
            } else {
                console.log("✅ 所有页面均已处理完成！");
                alert("跨页评价全部完成！");
                break;
            }
        }

        // 3. 进入课程评价
        console.log("进入课程...");
        await hyperClick(targetTr);
        await sleep(300);
        let pjBtn = listDoc.getElementById("btn_xspj_pj") || 
                    Array.from(listDoc.getElementsByTagName("button")).find(b => b.innerText.includes("评价"));
        if (pjBtn) await hyperClick(pjBtn);
        else targetTr.dispatchEvent(new MouseEvent('dblclick', {bubbles: true}));

        await sleep(1500); 

        // 4. 填写逻辑 (保留你的原始逻辑)
        let formDoc = getDoc('input.radio-pjf');
        let map = {};
        formDoc.querySelectorAll('input.radio-pjf').forEach(input => {
            let name = input.name;
            if (!map[name]) map[name] = [];
            map[name].push(input);
        });
        Object.values(map).forEach(options => {
            if (options.length > 0) {
                options[0].checked = true;
                options[0].dispatchEvent(new Event('click', { bubbles: true }));
                options[0].dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        formDoc.querySelectorAll('textarea.input-zgpj').forEach(textarea => {
            textarea.value = "无";
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        });

        await sleep(500);

        // 5. 保存并确认
        let saveBtn = formDoc.getElementById("btn_xspj_bc");
        if (saveBtn) {
            const win = formDoc.defaultView || window;
            win.confirm = () => true; win.alert = () => true;
            await hyperClick(saveBtn);
            await sleep(1000);
            let okBtn = formDoc.getElementById("btn_ok") || document.getElementById("btn_ok");
            if (!okBtn) {
                for(let f of document.getElementsByTagName("iframe")) {
                    try { if(f.contentDocument.getElementById("btn_ok")) { okBtn = f.contentDocument.getElementById("btn_ok"); break; } } catch(e){}
                }
            }
            if (okBtn) {
                await hyperClick(okBtn);
                await sleep(2000);
            }
        }

        // 6. 关闭窗口
        let closeBtn = document.querySelector(".ui-icon-closethick") || document.querySelector("button[title='关闭']");
        if (closeBtn) {
            try { await hyperClick(closeBtn); } catch(e) {}
            await sleep(800);
        }
    }
})();