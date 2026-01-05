(async function() {
    console.log("🚀 脚本启动 🚀");

    // 屏蔽系统内部 JS 报错干扰
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
        } catch (e) { console.log("⚠️ 点击微小异常，通常不影响流程"); }
    }

    function getCorrectDoc(selector) {
        if (document.querySelector(selector)) return document;
        const frames = document.getElementsByTagName("iframe");
        for (let f of frames) {
            try { if (f.contentDocument && f.contentDocument.querySelector(selector)) return f.contentDocument; } catch(e){}
        }
        return document;
    }

    while (true) {
        let listDoc = getCorrectDoc("td");
        let allTds = listDoc.getElementsByTagName("td");
        let targetTr = null;

        for (let td of allTds) {
            let statusText = td.innerText.trim();
            if (statusText.includes("未评") && td.parentElement.style.display !== 'none') {
                targetTr = td.parentElement;
                break;
            }
        }

        if (!targetTr) {
            console.log("✅ 全部评价完成！");
            alert("全部评价完成！");
            break;
        }

        console.log("正在进入课程...");
        await hyperClick(targetTr);
        await sleep(300);
        
        let pjBtn = listDoc.getElementById("btn_xspj_pj") || 
                    Array.from(listDoc.getElementsByTagName("button")).find(b => b.innerText.includes("评价"));
        if (pjBtn) await hyperClick(pjBtn);
        else targetTr.dispatchEvent(new MouseEvent('dblclick', {bubbles: true}));

        await sleep(1500); 

        let formDoc = getCorrectDoc('input.radio-pjf');
        console.log("✍️ 自动打分中...");

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
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
        });

        await sleep(500);

        let saveBtn = formDoc.getElementById("btn_xspj_bc");
        if (saveBtn) {
            const win = formDoc.defaultView || window;
            win.confirm = () => true;
            win.alert = () => true;

            console.log("💾 正在保存...");
            await hyperClick(saveBtn);
            await sleep(1000); // 增加等待时间，缓冲弹窗出现

            let okBtn = formDoc.getElementById("btn_ok") || document.getElementById("btn_ok");
            if (!okBtn) {
                const fs = document.getElementsByTagName("iframe");
                for(let f of fs) {
                    try { if(f.contentDocument.getElementById("btn_ok")) { okBtn = f.contentDocument.getElementById("btn_ok"); break; } } catch(e){}
                }
            }

            if (okBtn) {
                console.log("✅ 确认提交...");
                await hyperClick(okBtn);
                await sleep(2000); // 增加缓冲时间，避免系统 JS 崩溃
            }
        }

        // 强力关闭残留弹窗
        let closeBtn = document.querySelector(".ui-icon-closethick") || document.querySelector("button[title='关闭']");
        if (closeBtn) {
            try { await hyperClick(closeBtn); } catch(e) {}
            await sleep(800);
        }
        
        console.log("🔄 准备处理下一项...");
        await sleep(800);
    }
})();