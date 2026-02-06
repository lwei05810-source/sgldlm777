// 基于 SVG 设计的 JavaScript 功能文件

// 定位功能 - 自动获取用户位置
let currentLocation = null;

// 获取地理位置
function getCurrentLocation() {
    if (!navigator.geolocation) {
        console.error('浏览器不支持地理定位');
        updateLocationText('定位不可用');
        return;
    }

    // 请求位置权限
    navigator.geolocation.getCurrentPosition(
        // 成功回调
        function(position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            
            console.log('获取到位置:', latitude, longitude);
            
            // 使用逆地理编码获取地址
            reverseGeocode(latitude, longitude);
        },
        // 错误回调
        function(error) {
            console.error('定位失败:', error);
            let errorMsg = '定位失败';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg = '定位权限被拒绝';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg = '位置信息不可用';
                    break;
                case error.TIMEOUT:
                    errorMsg = '定位请求超时';
                    break;
            }
            
            updateLocationText(errorMsg);
        },
        // 选项
        {
            enableHighAccuracy: true,  // 高精度定位
            timeout: 10000,            // 10秒超时
            maximumAge: 0             // 不使用缓存
        }
    );
}

// 逆地理编码 - 将坐标转换为地址
function reverseGeocode(lat, lng) {
    // 方案1: 使用高德地图API（推荐，国内使用）
    // 需要申请高德地图API Key，替换下面的 YOUR_AMAP_API_KEY
    // const amapKey = 'YOUR_AMAP_API_KEY';
    // const url = `https://restapi.amap.com/v3/geocode/regeo?key=${amapKey}&location=${lng},${lat}`;
    // fetch(url)
    //     .then(response => response.json())
    //     .then(data => {
    //         if (data.status === '1' && data.regeocode) {
    //             const addressComponent = data.regeocode.addressComponent;
    //             const address = `${addressComponent.country} · ${addressComponent.city || addressComponent.province}`;
    //             updateLocationText(address);
    //             currentLocation = { lat, lng, address, fullAddress: data.regeocode.formatted_address };
    //             saveLocationToStorage(currentLocation);
    //         }
    //     });
    
    // 方案2: 使用百度地图API（推荐，国内使用）
    // 需要申请百度地图API Key，替换下面的 YOUR_BAIDU_API_KEY
    // const baiduKey = 'YOUR_BAIDU_API_KEY';
    // const url = `https://api.map.baidu.com/reverse_geocoding/v3/?ak=${baiduKey}&output=json&coordtype=wgs84ll&location=${lat},${lng}`;
    // fetch(url)
    //     .then(response => response.json())
    //     .then(data => {
    //         if (data.status === 0 && data.result) {
    //             const addressComponent = data.result.addressComponent;
    //             const address = `${addressComponent.country} · ${addressComponent.city || addressComponent.province}`;
    //             updateLocationText(address);
    //             currentLocation = { lat, lng, address, fullAddress: data.result.formatted_address };
    //             saveLocationToStorage(currentLocation);
    //         }
    //     });
    
    // 方案3: 使用Nominatim（OpenStreetMap，免费，无需API Key）
    // 注意：可能需要代理才能访问
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1&accept-language=zh-CN`;
    
    fetch(url, {
        headers: {
            'User-Agent': 'CloudReturn App'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('网络请求失败');
            }
            return response.json();
        })
        .then(data => {
            console.log('逆地理编码结果:', data);
            
            if (data && data.address) {
                // 格式化地址显示
                const address = formatAddress(data.address);
                updateLocationText(address);
                currentLocation = {
                    lat: lat,
                    lng: lng,
                    address: address,
                    fullAddress: data.display_name
                };
                
                // 保存到本地存储
                saveLocationToStorage(currentLocation);
            } else {
                updateLocationText('地址解析失败');
            }
        })
        .catch(error => {
            console.error('逆地理编码失败:', error);
            // 如果API失败，显示坐标
            updateLocationText(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            // 保存坐标信息
            currentLocation = {
                lat: lat,
                lng: lng,
                address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                fullAddress: `${lat}, ${lng}`
            };
            saveLocationToStorage(currentLocation);
        });
}

// 格式化地址显示
function formatAddress(address) {
    // 优先显示：国家 · 城市
    if (address.country && address.city) {
        return `${getCountryName(address.country)} · ${address.city}`;
    }
    
    // 次选：国家 · 州/省
    if (address.country && address.state) {
        return `${getCountryName(address.country)} · ${address.state}`;
    }
    
    // 再次：显示国家
    if (address.country) {
        return getCountryName(address.country);
    }
    
    // 最后：显示原始地址
    return address.display_name || '未知位置';
}

// 获取国家中文名称
function getCountryName(country) {
    const countryMap = {
        'China': '中国',
        'Ghana': '加纳',
        'United States': '美国',
        'United Kingdom': '英国',
        'Japan': '日本',
        'South Korea': '韩国',
        'Germany': '德国',
        'France': '法国',
        'Canada': '加拿大',
        'Australia': '澳大利亚'
    };
    
    return countryMap[country] || country;
}

// 更新位置文本
function updateLocationText(text) {
    const locationTspan = document.getElementById('location-tspan');
    if (locationTspan) {
        // 文字左对齐，x位置为0（图标右边缘 + 6px的位置）
        locationTspan.setAttribute('x', '0');
        locationTspan.textContent = text;
    }
}

// 保存位置到本地存储
function saveLocationToStorage(location) {
    try {
        location.timestamp = Date.now(); // 添加时间戳
        localStorage.setItem('userLocation', JSON.stringify(location));
        console.log('位置已保存到本地存储');
    } catch (error) {
        console.error('保存位置失败:', error);
    }
}

// 从本地存储加载位置
function loadLocationFromStorage() {
    try {
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
            const location = JSON.parse(savedLocation);
            updateLocationText(location.address);
            currentLocation = location;
            console.log('从本地存储加载位置:', location);
            return location;
        }
    } catch (error) {
        console.error('加载位置失败:', error);
    }
    return null;
}

// 按钮颜色配置
const buttonColors = {
    heaven: '#85d0f9',    // 蓝色（天堂）
    paradise: '#ff0000',   // 红色（净土）
    ancestors: '#ffd72e',  // 黄色（祖先）
    eternal: '#30ac94'     // 绿色（永恒）
};

// 圆点颜色配置（对应按钮）
const dotColors = {
    heaven: '#85d0f9',    // 蓝色（天堂）- 椭圆_4
    paradise: '#ff0000',   // 红色（净土）- 椭圆_3
    ancestors: '#ffd72e',  // 黄色（祖先）- 椭圆_2
    eternal: '#30ac94'     // 绿色（永恒）- 椭圆_1
};

// ===== 导航按钮（四个色块）在主图右下角的动态布局 =====
// 主图框：<g id="image-slot-1" transform="translate(0 159)">，宽 393，高 573.113
const NAV_BTN_OVERLAY = {
    frameX: 0,
    frameY: 159,
    frameW: 393,
    frameH: 573.113,
    paddingRight: 6,
    paddingBottom: 6,
    gap: 6, // 与下方7个缩略图间距一致
    btnW: 31.4764,
    btnH: 18.851,
    textDy: 12.782 // 约等于(725.044 - 712.262)，保持原视觉垂直位置
};

function isGuestModeActive() {
    try {
        const guestData = localStorage.getItem('guestData');
        if (!guestData) return false;
        const data = JSON.parse(guestData);
        return !!(data && data.isGuest);
    } catch (_) {
        return false;
    }
}

function getVisibleNavRealms() {
    // 游客：只显示永恒
    if (isGuestModeActive()) return ['eternal'];

    // 注册：只显示用户选定的2个按钮（灵魂归属）
    if (isRegistered && userInfo && Array.isArray(userInfo.soulAffiliations)) {
        const uniq = Array.from(new Set(userInfo.soulAffiliations || []))
            .filter((r) => !!buttonColors[r]);
        if (uniq.length >= 2) return uniq.slice(0, 2);
        if (uniq.length === 1) return uniq.slice(0, 1);
    }

    // 默认：显示全部（未注册也可浏览）
    return ['heaven', 'paradise', 'ancestors', 'eternal'];
}

function setSvgTranslate(el, x, y) {
    if (!el) return;
    el.setAttribute('transform', `translate(${x} ${y})`);
}

function layoutNavButtonsInMainImageCorner(visibleRealms) {
    const realms = Array.isArray(visibleRealms) ? visibleRealms.slice() : [];
    if (!realms.length) return;

    const frameRight = NAV_BTN_OVERLAY.frameX + NAV_BTN_OVERLAY.frameW;
    const frameBottom = NAV_BTN_OVERLAY.frameY + NAV_BTN_OVERLAY.frameH;
    const xRight = frameRight - NAV_BTN_OVERLAY.paddingRight;
    const yBottom = frameBottom - NAV_BTN_OVERLAY.paddingBottom;

    // 生成 realm => {rowFromBottom, colFromRight}
    const pos = {};

    if (realms.length >= 4) {
        // 2x2：永恒固定在右下角（最符合“永恒在主图右下角”的直觉）
        pos.eternal = { rowFromBottom: 0, colFromRight: 0 };
        pos.ancestors = { rowFromBottom: 0, colFromRight: 1 };
        pos.paradise = { rowFromBottom: 1, colFromRight: 0 };
        pos.heaven = { rowFromBottom: 1, colFromRight: 1 };
    } else if (realms.length === 2) {
        // 1列2行：永恒（如存在）放在最底部
        const ordered = realms.slice().sort((a, b) => {
            const aw = a === 'eternal' ? 1 : 0;
            const bw = b === 'eternal' ? 1 : 0;
            return aw - bw; // eternal排最后
        });
        pos[ordered[1]] = { rowFromBottom: 0, colFromRight: 0 };
        pos[ordered[0]] = { rowFromBottom: 1, colFromRight: 0 };
    } else {
        // 1个：右下角
        pos[realms[0]] = { rowFromBottom: 0, colFromRight: 0 };
    }

    const allRealms = ['heaven', 'paradise', 'ancestors', 'eternal'];
    allRealms.forEach((realm) => {
        const button = document.querySelector(`.nav-button-group[data-button="${realm}"]`);
        if (!button) return;
        if (!pos[realm]) return;

        const rowFromBottom = pos[realm].rowFromBottom || 0;
        const colFromRight = pos[realm].colFromRight || 0;

        const x = xRight - NAV_BTN_OVERLAY.btnW - colFromRight * (NAV_BTN_OVERLAY.btnW + NAV_BTN_OVERLAY.gap);
        const y = yBottom - NAV_BTN_OVERLAY.btnH - rowFromBottom * (NAV_BTN_OVERLAY.btnH + NAV_BTN_OVERLAY.gap);

        const rect = button.querySelector('.nav-btn-rect');
        const text = button.querySelector('.nav-btn-text');

        if (rect) {
            rect.setAttribute('width', String(NAV_BTN_OVERLAY.btnW));
            rect.setAttribute('height', String(NAV_BTN_OVERLAY.btnH));
            setSvgTranslate(rect, x, y);
        }
        if (text) {
            // 文字以按钮水平中心对齐，y使用与原版一致的基线偏移
            setSvgTranslate(text, x + NAV_BTN_OVERLAY.btnW / 2, y + NAV_BTN_OVERLAY.textDy);
        }
    });
}

function applyNavButtonsView(options = {}) {
    const { ensureSelectionVisible = false } = options || {};
    const visible = getVisibleNavRealms();
    const allRealms = ['heaven', 'paradise', 'ancestors', 'eternal'];

    allRealms.forEach((realm) => {
        const button = document.querySelector(`.nav-button-group[data-button="${realm}"]`);
        if (!button) return;
        const show = visible.includes(realm);
        // SVG里 display="" 表示使用默认值；display="none" 彻底隐藏并不响应点击
        button.style.display = show ? '' : 'none';
        button.style.pointerEvents = show ? 'all' : 'none';
    });

    layoutNavButtonsInMainImageCorner(visible);

    if (ensureSelectionVisible) {
        if (!currentSelectedButton || !visible.includes(currentSelectedButton)) {
            const next = visible[visible.length - 1] || 'eternal';
            // 交给现有逻辑（会同步图片/文字/颜色）
            try { navigateTo(next); } catch (_) {}
        }
    }
}

// 当前选中的按钮
let currentSelectedButton = null;

// 导航功能 - 处理按钮点击和状态切换
function navigateTo(destination) {
    console.log('导航到:', destination);
    
    // 检查按钮是否被锁定，如果锁定则直接返回，不显示任何提示
    if (isButtonLocked(destination)) {
        console.log('按钮已被锁定，无响应');
        return;
    }
    
    // 先清除所有按钮的选中状态（未选中的变为白色）
    clearButtonSelection();
    
    // 设置当前按钮为选中状态（填充对应颜色）
    selectButton(destination);
    
    // 保存选中状态
    currentSelectedButton = destination;
    localStorage.setItem('selectedButton', destination);
    
    // 根据目标执行不同的操作
    switch(destination) {
        case 'heaven':
            // 导航到天堂页面
            console.log('导航到天堂');
            break;
        case 'paradise':
            // 导航到净土页面
            console.log('导航到净土');
            break;
        case 'ancestors':
            // 导航到祖先页面
            console.log('导航到祖先');
            break;
        case 'eternal':
            // 导航到永恒页面
            console.log('导航到永恒');
            break;
        default:
            console.log('未知的目标:', destination);
    }
    
    // 更新图标显示
    updateRealmIcon(destination);
    
    // 切换选项时，显示对应选项的图片
    switchRealmImage(destination);
    
    // 可以在这里添加页面切换逻辑
    // 例如：显示/隐藏不同的内容区域
}

// 检查按钮是否被锁定
function isButtonLocked(realm) {
    // 游客模式下：只有"永恒"按钮可用，其他三个按钮锁定
    const guestData = localStorage.getItem('guestData');
    if (guestData) {
        try {
            const data = JSON.parse(guestData);
            if (data.isGuest) {
                // 游客模式下，只有"eternal"（永恒）不锁定，其他都锁定
                return realm !== 'eternal';
            }
        } catch (e) {
            // 忽略解析错误
        }
    }
    
    if (!isRegistered || !userInfo || !userInfo.soulAffiliations) {
        return false; // 未注册或没有选择灵魂归属，不锁定
    }
    
    // 如果选择的灵魂归属中包含该realm，则未锁定；否则锁定
    return !userInfo.soulAffiliations.includes(realm);
}

// 根据选择的灵魂归属更新按钮锁定状态
function updateButtonLockStatus(selectedSoulAffiliations) {
    const realms = ['heaven', 'paradise', 'ancestors', 'eternal'];
    const realmNames = {
        'heaven': '天堂',
        'paradise': '净土',
        'ancestors': '祖先',
        'eternal': '永恒'
    };
    
    realms.forEach(realm => {
        const button = document.querySelector(`.nav-button-group[data-button="${realm}"]`);
        if (button) {
            const isLocked = !selectedSoulAffiliations.includes(realm);
            
            if (isLocked) {
                // 锁定按钮：添加锁定样式，禁用点击
                button.classList.add('button-locked');
                button.style.opacity = '0.5';
                button.style.cursor = 'not-allowed';
                button.style.pointerEvents = 'none';
                
                // 添加锁定图标或文字提示
                const rect = button.querySelector('.nav-btn-rect');
                const text = button.querySelector('.nav-btn-text');
                if (rect) {
                    rect.setAttribute('fill', '#666666'); // 灰色表示锁定
                }
                if (text) {
                    text.setAttribute('fill', '#999999');
                }
                
                console.log(`🔒 按钮 "${realmNames[realm]}" 已锁定`);
            } else {
                // 解锁按钮：移除锁定样式，启用点击
                button.classList.remove('button-locked');
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
                button.style.pointerEvents = 'all';
                
                console.log(`🔓 按钮 "${realmNames[realm]}" 已解锁`);
            }
        }
    });
    
    // 如果当前选中的按钮被锁定，切换到第一个未锁定的按钮
    if (currentSelectedButton && isButtonLocked(currentSelectedButton)) {
        const firstUnlocked = selectedSoulAffiliations[0];
        if (firstUnlocked) {
            navigateTo(firstUnlocked);
        }
    }
}

// 切换选项时显示对应选项的图片
function switchRealmImage(realm) {
    const img = document.querySelector(`.slot-image[data-slot="1"]`);
    const container = document.querySelector(`.image-container[data-slot="1"]`);
    const iconContainer = document.getElementById('realm-icon-container');
    const removeBtn = document.querySelector(`.image-remove-btn[data-slot="1"]`);
    
    if (!img || !container) {
        console.error('❌ 找不到图片元素或容器');
        return;
    }
    
    // 获取当前选项的图片数组
    const images = realmImages[realm] || [];
    const currentIndex = realmCurrentImageIndex[realm] || 0;
    
    if (images.length > 0 && images[currentIndex]) {
        // 如果有图片，显示当前索引的图片
        console.log('✅ 显示选项', realm, '的第', currentIndex + 1, '张图片');
        img.src = images[currentIndex];
        img.style.display = 'block';
        
        // 隐藏图标
        if (iconContainer) {
            iconContainer.style.display = 'none';
        }
        
        // 显示删除按钮
        if (removeBtn) {
            removeBtn.style.display = 'block';
            removeBtn.style.visibility = 'visible';
            removeBtn.style.opacity = '1';
        }
        
        // 调整图片位置
        setTimeout(() => {
            adjustImageInSlot(1, img, container, realm, currentIndex);
            detectImageBrightnessAndAdjustButton(1, img);
            // 如果显示思念文字，也要调整文字颜色（会自动同步生卒年颜色）
            adjustThoughtTextColor();
        }, 50);
    } else {
        // 如果没有图片，显示空白框和图标
        console.log('✅ 选项', realm, '没有图片，显示空白框和图标');
        img.src = '';
        img.style.display = 'none';
        
        // 显示图标
        if (iconContainer) {
            iconContainer.style.display = 'block';
        }
        updateRealmIcon(realm);
        
        // 隐藏删除按钮
        if (removeBtn) {
            removeBtn.style.display = 'none';
            removeBtn.style.visibility = 'hidden';
            removeBtn.style.opacity = '0';
        }
    }
    
    // 更新小图框显示
    updateThumbnails(realm);
    
    // 切换realm时，加载对应realm的思念文字和生卒年
    loadThoughtTextForRealm(realm);
}

// 更新领域图标显示
function updateRealmIcon(destination) {
    const iconContainer = document.getElementById('realm-icon-container');
    if (!iconContainer) {
        console.warn('未找到图标容器');
        return;
    }
    
    // 隐藏所有图标
    const allIcons = iconContainer.querySelectorAll('.realm-icon');
    allIcons.forEach(icon => {
        icon.style.display = 'none';
    });
    
    // 根据选择显示对应图标
    let iconId = '';
    switch(destination) {
        case 'heaven':
            iconId = 'icon-heaven';
            break;
        case 'paradise':
            iconId = 'icon-paradise';
            break;
        case 'ancestors':
            iconId = 'icon-ancestors';
            break;
        case 'eternal':
            iconId = 'icon-eternal';
            break;
        default:
            iconContainer.style.display = 'none';
            return;
    }
    
    const targetIcon = document.getElementById(iconId);
    if (targetIcon) {
        targetIcon.style.display = 'block';
        iconContainer.style.display = 'block';
        console.log('✅ 显示图标:', iconId);
    } else {
        iconContainer.style.display = 'none';
        console.warn('未找到图标:', iconId);
    }
}

// 清除所有按钮的选中状态（未选中的按钮显示白色填充）
function clearButtonSelection() {
    console.log('清除所有按钮选中状态');
    const buttons = document.querySelectorAll('.nav-button-group');
    console.log('找到按钮数量:', buttons.length);
    
    buttons.forEach(button => {
        const rect = button.querySelector('.nav-btn-rect');
        const text = button.querySelector('.nav-btn-text');
        
        if (rect && text) {
            // 未选中状态：白色填充，白色边框，白色文字
            // 由于HTML中有内联style，必须直接修改style属性
            rect.style.fill = '#fff';
            rect.style.stroke = '#fff';
            rect.style.strokeWidth = '0.659px';
            
            // 同时设置属性作为备用
            rect.setAttribute('fill', '#fff');
            rect.setAttribute('stroke', '#fff');
            rect.setAttribute('stroke-width', '0.659');
            
            text.style.fill = '#3c3c3c'; // 文字改为深色，在白色背景上可见
            text.setAttribute('fill', '#3c3c3c');
            
            // 移除选中类
            rect.classList.remove('selected');
            button.classList.remove('selected');
        } else {
            console.warn('按钮元素缺失:', { rect: !!rect, text: !!text });
        }
    });
}

// 更新圆点颜色
function updateDotColors(selectedButtonName) {
    console.log('更新圆点颜色，选中按钮:', selectedButtonName);
    const dots = document.querySelectorAll('.dot-indicator');
    
    dots.forEach(dot => {
        const dotButtonName = dot.getAttribute('data-dot');
        const originalColor = dotColors[dotButtonName];
        
        if (dotButtonName === selectedButtonName) {
            // 选中的圆点保持原色
            dot.style.fill = originalColor;
            dot.setAttribute('fill', originalColor);
            console.log(`圆点 ${dotButtonName} 保持原色:`, originalColor);
        } else {
            // 未选中的圆点变为白色
            dot.style.fill = '#fff';
            dot.setAttribute('fill', '#fff');
            console.log(`圆点 ${dotButtonName} 变为白色`);
        }
    });
}

// 选中指定按钮
function selectButton(buttonName) {
    console.log('选中按钮:', buttonName);
    const buttonGroup = document.querySelector(`[data-button="${buttonName}"]`);
    
    if (!buttonGroup) {
        console.error('未找到按钮组:', buttonName);
        return;
    }
    
    const rect = buttonGroup.querySelector('.nav-btn-rect');
    const text = buttonGroup.querySelector('.nav-btn-text');
    const color = buttonColors[buttonName];
    
    console.log('按钮元素:', { rect: !!rect, text: !!text, color });
    
    if (rect && text && color) {
        // 设置选中状态：填充对应颜色，白色边框，白色文字
        // 由于HTML中有内联style，必须直接修改style属性
        rect.style.fill = color;
        rect.style.stroke = '#fff';
        rect.style.strokeWidth = '0.659px';
        
        // 同时设置属性作为备用
        rect.setAttribute('fill', color);
        rect.setAttribute('stroke', '#fff');
        rect.setAttribute('stroke-width', '0.659');
        
        text.style.fill = '#fff';
        text.setAttribute('fill', '#fff');
        
        // 添加选中类用于标识
        rect.classList.add('selected');
        buttonGroup.classList.add('selected');
        
        console.log('按钮样式已更新:', buttonName, color);
        console.log('rect style.fill:', rect.style.fill);
        console.log('rect fill属性:', rect.getAttribute('fill'));
        
        // 更新圆点颜色
        updateDotColors(buttonName);

        // 同步更新主图框左上角提示文字颜色
        updateImageSlotNoteColor(buttonName);
    } else {
        console.error('按钮元素缺失:', { rect: !!rect, text: !!text, color });
    }
}

function updateImageSlotNoteColor(buttonName) {
    // 旧逻辑：跟随导航按钮颜色
    // 新逻辑：根据底图亮度自适应黑/白
    adjustImageSlotNoteTextColor();
}

// “这世界我来过”：根据底图亮度自适应黑/白（取样文字所在位置下方的图片区域）
function adjustImageSlotNoteTextColor() {
    const noteEl = document.getElementById('image-slot-note-text');
    if (!noteEl) return;
    const img = document.querySelector('.slot-image[data-slot="1"]');

    const applyColor = (c) => {
        try {
            // 保留原有字体/指针样式，仅替换 fill
            if (typeof setSvgTextFillPreserveStyle === 'function') {
                setSvgTextFillPreserveStyle(noteEl, c, false);
            } else {
                noteEl.setAttribute('fill', c);
                try { noteEl.style.fill = c; } catch (_) {}
            }
        } catch (_) {
            noteEl.setAttribute('fill', c);
            try { noteEl.style.fill = c; } catch (_) {}
        }
    };

    // 没有图片时，默认白色（与黑色背景更协调）
    if (!img || img.style.display === 'none' || !img.src) {
        applyColor('#ffffff');
        return;
    }

    // 等待图片可用
    if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
        setTimeout(adjustImageSlotNoteTextColor, 80);
        return;
    }

    try {
        const near = sampleImageBrightnessNearElement(img, noteEl);
        if (near == null) {
            applyColor('#ffffff');
            return;
        }
        const textColor = near > 128 ? '#000000' : '#ffffff';
        applyColor(textColor);
    } catch (e) {
        // 出错时保底白色
        applyColor('#ffffff');
    }
}

// 放大页底部说明文字：颜色逻辑与“这世界，我来过。”一致
function adjustFullscreenNoteTextColor() {
    const noteEl = document.getElementById('fullscreen-note-text');
    const img = document.getElementById('fullscreen-image');
    if (!noteEl || !img) return;
    if (!isFullscreen) return;

    const applyColor = (c) => {
        noteEl.style.color = c;
    };

    if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
        setTimeout(adjustFullscreenNoteTextColor, 80);
        return;
    }

    try {
        const near = sampleImageBrightnessNearElement(img, noteEl);
        if (near == null) {
            applyColor('#ffffff');
            return;
        }
        const textColor = near > 128 ? '#000000' : '#ffffff';
        applyColor(textColor);
    } catch (_) {
        applyColor('#ffffff');
    }
}

// 初始化按钮选中状态
function initButtonSelection() {
    // 先清除所有按钮状态
    clearButtonSelection();
    
    // 加载选项图片数据
    loadRealmImages();
    
    // 根据游客/注册状态：决定显示哪些按钮 + 布局到主图右下角
    applyNavButtonsView();
    
    // 尝试从本地存储加载上次选中的按钮
    const savedButton = localStorage.getItem('selectedButton');
    const visibleRealms = getVisibleNavRealms();
    
    // 选择初始按钮：
    // - 游客：永恒
    // - 注册：优先上次按钮（且在可见列表中），否则选第一个可见
    // - 未注册：保留原逻辑（优先上次按钮，否则天堂）
    let initial = 'heaven';
    if (isGuestModeActive()) {
        initial = 'eternal';
    } else if (savedButton && buttonColors[savedButton] && visibleRealms.includes(savedButton) && !isButtonLocked(savedButton)) {
        initial = savedButton;
    } else if (visibleRealms && visibleRealms.length) {
        initial = visibleRealms[0];
    }

    selectButton(initial);
    currentSelectedButton = initial;
    localStorage.setItem('selectedButton', initial);
    switchRealmImage(initial);
    loadThoughtTextForRealm(initial);
}

// 记录功能
function handleRecord() {
    console.log('记录我自己');
    
    // 可以在这里添加记录功能的逻辑
    // 例如：打开表单、相机、或导航到记录页面
    alert('记录功能 - 待实现');
}

// 图片加载功能
function loadImages() {
    const imageItems = document.querySelectorAll('.image-item');
    
    imageItems.forEach((item, index) => {
        const placeholder = item.querySelector('.image-placeholder');
        
        // 可以在这里添加图片加载逻辑
        // 例如：从 API 获取图片 URL 并设置
        // const img = document.createElement('img');
        // img.src = `path/to/image-${index + 1}.jpg`;
        // img.alt = `图片 ${index + 1}`;
        // placeholder.appendChild(img);
    });
}

// 添加按钮事件监听器
function setupButtonEvents() {
    // 使用setTimeout确保SVG完全加载
    setTimeout(function() {
        const buttons = document.querySelectorAll('.nav-button-group');
        console.log('找到按钮数量:', buttons.length);
        
        if (buttons.length === 0) {
            console.error('未找到按钮元素，重试...');
            // 如果没找到，再试一次
            setTimeout(setupButtonEvents, 100);
            return;
        }
        
        buttons.forEach((button, index) => {
            const buttonName = button.getAttribute('data-button');
            console.log(`设置按钮 ${index + 1}: ${buttonName}`);
            
            // 点击事件处理函数
            function handleClick(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('按钮被点击:', buttonName);
                navigateTo(buttonName);
            }
            
            // 触摸开始处理函数
            function handleTouchStart(e) {
                e.preventDefault();
                button.style.opacity = '0.8';
            }
            
            // 触摸结束处理函数
            function handleTouchEnd(e) {
                e.preventDefault();
                setTimeout(() => {
                    button.style.opacity = '1';
                }, 100);
            }
            
            // 鼠标进入处理函数
            function handleMouseEnter() {
                if (currentSelectedButton !== buttonName) {
                    const rect = button.querySelector('.nav-btn-rect');
                    if (rect) {
                        rect.setAttribute('opacity', '0.7');
                    }
                }
            }
            
            // 鼠标离开处理函数
            function handleMouseLeave() {
                if (currentSelectedButton !== buttonName) {
                    const rect = button.querySelector('.nav-btn-rect');
                    if (rect) {
                        rect.setAttribute('opacity', '1');
                    }
                }
            }
            
            // 绑定事件
            button.addEventListener('click', handleClick);
            button.addEventListener('touchstart', handleTouchStart, { passive: false });
            button.addEventListener('touchend', handleTouchEnd, { passive: false });
            button.addEventListener('mouseenter', handleMouseEnter);
            button.addEventListener('mouseleave', handleMouseLeave);
            
            // 也绑定到rect和text元素上，确保点击有效
            const rect = button.querySelector('.nav-btn-rect');
            const text = button.querySelector('.nav-btn-text');
            
            if (rect) {
                rect.addEventListener('click', handleClick);
                rect.style.cursor = 'pointer';
            }
            
            if (text) {
                text.addEventListener('click', handleClick);
                text.style.cursor = 'pointer';
            }
        });
        
        console.log('按钮事件绑定完成');
    }, 100);
}

// 注册按钮点击处理函数（全局定义，确保可访问）
function handleRegisterButtonClick(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('✅✅✅ 注册按钮被点击！', e.target);
    
    // 如果已注册，显示用户信息
    if (isRegistered && userInfo) {
        alert(`已注册用户：${userInfo.username}\n邮箱：${userInfo.email}`);
    } else {
        // 打开注册弹窗
        console.log('打开注册弹窗...');
        openRegisterModal();
    }
}

// 绑定注册按钮事件的独立函数（使用多种选择器）
function bindRegisterButton() {
    // 尝试多种选择器
    let registerButton = document.querySelector('.register-button');
    if (!registerButton) {
        registerButton = document.querySelector('#组_4');
    }
    if (!registerButton) {
        registerButton = document.querySelector('[data-name="组 4"]');
    }
    
    let registerIcon = document.querySelector('.register-icon');
    if (!registerIcon) {
        registerIcon = document.querySelector('#路径_2');
    }
    if (!registerIcon && registerButton) {
        registerIcon = registerButton.querySelector('path');
    }
    
    console.log('🔍 查找注册按钮元素:', {
        button: !!registerButton,
        icon: !!registerIcon,
        buttonElement: registerButton,
        iconElement: registerIcon,
        buttonId: registerButton ? registerButton.id : null,
        iconId: registerIcon ? registerIcon.id : null
    });
    
    if (!registerButton) {
        console.log('❌ 注册按钮未找到，稍后重试...');
        return false;
    }
    
    // 如果已经绑定过，先移除旧的事件监听器
    if (registerButton.hasAttribute('data-bound')) {
        console.log('⚠️ 注册按钮已绑定，重新绑定...');
        // 移除data-bound属性，允许重新绑定
        registerButton.removeAttribute('data-bound');
    }
    
    console.log('🔧 开始绑定注册按钮事件...');
    registerButton.setAttribute('data-bound', 'true');
    
    // 确保pointer-events设置正确
    registerButton.style.pointerEvents = 'all';
    registerButton.style.cursor = 'pointer';
    registerButton.style.zIndex = '1000'; // 确保在最上层
    
    // 创建新的事件处理函数，避免重复绑定
    const clickHandler = function(e) {
        console.log('🖱️ 注册按钮点击事件触发！', e.target, e.currentTarget);
        handleRegisterButtonClick(e);
    };
    
    // 绑定到g元素（使用once: false，允许多次绑定）
    registerButton.addEventListener('click', clickHandler, { capture: true, once: false });
    registerButton.addEventListener('click', clickHandler, { capture: false, once: false });
    console.log('✅ 注册按钮g元素事件已绑定（捕获+冒泡）');
    
    // 也绑定到path元素，确保点击有效
    if (registerIcon) {
        registerIcon.style.cursor = 'pointer';
        registerIcon.style.pointerEvents = 'all';
        registerIcon.style.zIndex = '1001';
        registerIcon.addEventListener('click', clickHandler, { capture: true, once: false });
        registerIcon.addEventListener('click', clickHandler, { capture: false, once: false });
        console.log('✅ 注册图标path元素事件已绑定（捕获+冒泡）');
    } else {
        console.warn('⚠️ 注册图标path元素未找到');
    }
    
    // 添加触摸事件（移动端支持）
    const touchStartHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.style.opacity = '0.8';
        console.log('📱 注册按钮触摸开始');
    };
    
    const touchEndHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('📱 注册按钮触摸结束，触发点击');
        // 触摸结束时触发点击
        handleRegisterButtonClick(e);
        setTimeout(() => {
            this.style.opacity = '1';
        }, 100);
    };
    
    registerButton.addEventListener('touchstart', touchStartHandler, { passive: false, capture: true });
    registerButton.addEventListener('touchend', touchEndHandler, { passive: false, capture: true });
    
    // 触摸事件也绑定到path元素
    if (registerIcon) {
        registerIcon.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            registerButton.style.opacity = '0.8';
        }, { passive: false, capture: true });
        
        registerIcon.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📱 注册图标触摸结束，触发点击');
            handleRegisterButtonClick(e);
            setTimeout(() => {
                registerButton.style.opacity = '1';
            }, 100);
        }, { passive: false, capture: true });
    }
    
    // 使用事件委托，在SVG容器上监听（更强大的版本）
    const svgContainer = document.querySelector('svg');
    if (svgContainer && !svgContainer.hasAttribute('data-register-delegated')) {
        svgContainer.setAttribute('data-register-delegated', 'true');
        
        // 点击事件处理函数
        function svgClickHandler(e) {
            const target = e.target;
            let shouldHandle = false;
            
            // 检查多种情况
            if (target) {
                // 直接匹配
                if (target.classList && (
                    target.classList.contains('register-button') ||
                    target.classList.contains('register-icon')
                )) {
                    shouldHandle = true;
                }
                // ID匹配
                else if (target.id === '组_4' || target.id === '路径_2') {
                    shouldHandle = true;
                }
                // 向上查找父元素
                else if (target.closest) {
                    const closestButton = target.closest('.register-button') || target.closest('#组_4');
                    if (closestButton) {
                        shouldHandle = true;
                    }
                }
                // 检查父节点
                else {
                    let parent = target.parentElement;
                    while (parent && parent !== svgContainer) {
                        if (parent.classList && parent.classList.contains('register-button')) {
                            shouldHandle = true;
                            break;
                        }
                        if (parent.id === '组_4') {
                            shouldHandle = true;
                            break;
                        }
                        parent = parent.parentElement;
                    }
                }
            }
            
            if (shouldHandle) {
                console.log('🎯🎯🎯 通过事件委托捕获到注册按钮点击！', target);
                e.preventDefault();
                e.stopPropagation();
                handleRegisterButtonClick(e);
            }
        }
        
        // 在捕获和冒泡阶段都监听
        svgContainer.addEventListener('click', svgClickHandler, true); // 捕获阶段
        svgContainer.addEventListener('click', svgClickHandler, false); // 冒泡阶段
        
        console.log('✅ SVG事件委托已设置');
    }
    
    console.log('✅✅✅ 注册按钮事件绑定完成！');
    return true;
}

// 添加图片功能
function initAddImageButton() {
    const addImageButton = document.querySelector('#add-image-button');
    const imageInput = document.getElementById('image-input');
    
    if (!addImageButton || !imageInput) {
        console.log('添加图片按钮或输入框未找到，稍后重试...');
        return false;
    }
    
    // 点击图标时触发文件选择（只绑定一次）
    if (!addImageButton.hasAttribute('data-bound')) {
        addImageButton.setAttribute('data-bound', 'true');
        addImageButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ 点击添加图片图标');
            // 重置input，确保可以再次选择
            imageInput.value = '';
            // 立即触发文件选择对话框
            imageInput.click();
        });
    }
    
    // 文件选择后处理（只绑定一次）
    if (!imageInput.hasAttribute('data-bound')) {
        imageInput.setAttribute('data-bound', 'true');
        imageInput.addEventListener('change', function handleFileChange(e) {
            const files = e.target.files;
            
            if (!files || files.length === 0) {
                console.log('⚠️ 未选择文件或取消选择');
                return;
            }
            
            console.log('✅ 选择了', files.length, '个文件');
            
            // 检查是否还有空位
            const filledCount = countFilledSlots();
            const remainingSlots = 9 - filledCount;
            
            if (remainingSlots <= 0) {
                alert('所有位置都已添加图片！');
                this.value = '';
                return;
            }
            
            // 处理所有选中的文件（最多剩余空位数）
            const filesToProcess = Array.from(files).slice(0, remainingSlots);
            
            if (files.length > filesToProcess.length) {
                alert(`只能添加${filesToProcess.length}张图片（剩余位置不足）`);
            }
            
            // 依次处理每个文件
            filesToProcess.forEach((file, index) => {
                console.log(`📤 处理文件 ${index + 1}/${filesToProcess.length}:`, file.name);
                handleImageUpload(file);
            });
            
            // 重置input，允许再次选择
            this.value = '';
            console.log('✅ 文件处理完成，Input已重置');
        });
    }
    
    console.log('✅ 添加图片按钮已绑定（支持多选）');
    return true;
}

// 当前要添加的图片位置索引（只有1个位置）
let currentImageSlot = 1;

// 存储每个选项的图片数据（heaven, paradise, ancestors, eternal）
// 每个选项最多存储7张图片，格式：{heaven: [image1, image2, ...], ...}
const realmImages = {
    heaven: [],
    paradise: [],
    ancestors: [],
    eternal: []
};

// 存储每个选项当前显示的大图索引（0表示第一张）
const realmCurrentImageIndex = {
    heaven: 0,
    paradise: 0,
    ancestors: 0,
    eternal: 0
};

// 存储每个选项的每个图片的思念文字（heaven, paradise, ancestors, eternal）
// 格式：{heaven: ['文字1', '文字2', ...], ...}
const realmThoughtTexts = {
    heaven: [],
    paradise: [],
    ancestors: [],
    eternal: []
};

// 存储每个选项的每个图片的生卒年（heaven, paradise, ancestors, eternal）
// 格式：{heaven: ['1949-2049', '1950-2050', ...], ...}
const realmBirthDeath = {
    heaven: [],
    paradise: [],
    ancestors: [],
    eternal: []
};

// 每个选项/每张图片的文字颜色（自定义色；空表示使用自动黑白）
// 格式：{heaven: ['#ffffff', '', ...], ...}
const realmTextColors = {
    heaven: [],
    paradise: [],
    ancestors: [],
    eternal: []
};

// 存储每个选项/每张图片的构图（缩放/位移）
// 格式：{heaven: [{scale, tx, ty}, ...], ...}
const realmImageTransforms = {
    heaven: [],
    paradise: [],
    ancestors: [],
    eternal: []
};

// 从本地存储加载图片数据
function loadRealmImages() {
    try {
        const saved = localStorage.getItem('realmImages');
        if (saved) {
            const parsed = JSON.parse(saved);
            // 确保每个选项都是数组
            Object.keys(realmImages).forEach(key => {
                if (parsed[key]) {
                    // 如果是旧格式（单个图片），转换为数组
                    if (typeof parsed[key] === 'string') {
                        realmImages[key] = [parsed[key]];
                    } else if (Array.isArray(parsed[key])) {
                        realmImages[key] = parsed[key].slice(0, 7); // 最多7张
                    }
                }
            });
            console.log('✅ 已加载选项图片数据');
        }
        
        // 加载当前图片索引
        const savedIndex = localStorage.getItem('realmCurrentImageIndex');
        if (savedIndex) {
            const parsedIndex = JSON.parse(savedIndex);
            Object.keys(realmCurrentImageIndex).forEach(key => {
                if (parsedIndex[key] !== undefined) {
                    realmCurrentImageIndex[key] = parsedIndex[key];
                }
            });
            console.log('✅ 已加载当前图片索引');
        }
        
        // 加载每个选项的每个图片的思念文字
        const savedThoughtTexts = localStorage.getItem('realmThoughtTexts');
        if (savedThoughtTexts) {
            const parsedThoughtTexts = JSON.parse(savedThoughtTexts);
            Object.keys(realmThoughtTexts).forEach(key => {
                if (parsedThoughtTexts[key] !== undefined) {
                    // 如果是旧格式（字符串），转换为数组格式
                    if (typeof parsedThoughtTexts[key] === 'string') {
                        realmThoughtTexts[key] = [parsedThoughtTexts[key]];
                    } else if (Array.isArray(parsedThoughtTexts[key])) {
                        realmThoughtTexts[key] = parsedThoughtTexts[key];
                    } else {
                        realmThoughtTexts[key] = [];
                    }
                } else {
                    realmThoughtTexts[key] = [];
                }
            });
            console.log('✅ 已加载选项思念文字数据:', JSON.stringify(realmThoughtTexts));
        } else {
            // 如果没有保存的数据，初始化为空数组
            Object.keys(realmThoughtTexts).forEach(key => {
                realmThoughtTexts[key] = [];
            });
        }
        
        // 加载每个选项的每个图片的生卒年
        const savedBirthDeath = localStorage.getItem('realmBirthDeath');
        if (savedBirthDeath) {
            const parsedBirthDeath = JSON.parse(savedBirthDeath);
            Object.keys(realmBirthDeath).forEach(key => {
                if (parsedBirthDeath[key] !== undefined) {
                    // 如果是旧格式（字符串），转换为数组格式
                    if (typeof parsedBirthDeath[key] === 'string') {
                        realmBirthDeath[key] = [parsedBirthDeath[key]];
                    } else if (Array.isArray(parsedBirthDeath[key])) {
                        realmBirthDeath[key] = parsedBirthDeath[key];
                    } else {
                        realmBirthDeath[key] = [];
                    }
                } else {
                    realmBirthDeath[key] = [];
                }
            });
            console.log('✅ 已加载选项生卒年数据:', JSON.stringify(realmBirthDeath));
        } else {
            // 如果没有保存的数据，初始化为空数组
            Object.keys(realmBirthDeath).forEach(key => {
                realmBirthDeath[key] = [];
            });
        }

        // 加载每个选项的每张图片的自定义文字颜色（可选）
        const savedTextColors = localStorage.getItem('realmTextColors');
        if (savedTextColors) {
            const parsedTextColors = JSON.parse(savedTextColors);
            Object.keys(realmTextColors).forEach(key => {
                const v = parsedTextColors ? parsedTextColors[key] : null;
                if (typeof v === 'string') {
                    realmTextColors[key] = [v];
                } else if (Array.isArray(v)) {
                    realmTextColors[key] = v.slice(0, 7);
                } else {
                    realmTextColors[key] = [];
                }
            });
            console.log('✅ 已加载选项自定义文字颜色数据:', JSON.stringify(realmTextColors));
        } else {
            Object.keys(realmTextColors).forEach(key => {
                realmTextColors[key] = [];
            });
        }

        // 加载每个选项的图片构图（缩放/位移）
        const savedTransforms = localStorage.getItem('realmImageTransforms');
        if (savedTransforms) {
            const parsedTransforms = JSON.parse(savedTransforms);
            Object.keys(realmImageTransforms).forEach((key) => {
                if (Array.isArray(parsedTransforms[key])) {
                    realmImageTransforms[key] = parsedTransforms[key];
                } else {
                    realmImageTransforms[key] = [];
                }
            });
            console.log('✅ 已加载图片构图数据');
        }
        
        // 清除旧的全局数据（如果存在）
        if (localStorage.getItem('userThought')) {
            localStorage.removeItem('userThought');
            console.log('🧹 已清除旧的全局userThought数据');
        }
        if (localStorage.getItem('userBirthDeath')) {
            localStorage.removeItem('userBirthDeath');
            console.log('🧹 已清除旧的全局userBirthDeath数据');
        }
    } catch (error) {
        console.error('❌ 加载选项图片数据失败:', error);
    }
}

function saveRealmTextColors() {
    try {
        localStorage.setItem('realmTextColors', JSON.stringify(realmTextColors));
    } catch (_) {}
}

function saveRealmImageTransforms() {
    try {
        localStorage.setItem('realmImageTransforms', JSON.stringify(realmImageTransforms));
    } catch (_) {}
}

function normalizeHexColor(value) {
    const v = (value || '').toString().trim();
    if (!v) return '';
    if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase();
    return '';
}

function getImageTransform(realm, index) {
    if (!realm) return null;
    const arr = realmImageTransforms[realm];
    const idx = Number.isFinite(index) ? index : 0;
    if (!Array.isArray(arr)) return null;
    const t = arr[idx];
    if (!t || typeof t !== 'object') return null;
    const scale = Number(t.scale);
    const tx = Number(t.tx);
    const ty = Number(t.ty);
    if (!Number.isFinite(scale) || !Number.isFinite(tx) || !Number.isFinite(ty)) return null;
    return { scale, tx, ty };
}

function setImageTransform(realm, index, transform) {
    if (!realm || !Number.isFinite(index) || !transform) return;
    if (!Array.isArray(realmImageTransforms[realm])) realmImageTransforms[realm] = [];
    realmImageTransforms[realm][index] = {
        scale: Number(transform.scale) || 1,
        tx: Number(transform.tx) || 0,
        ty: Number(transform.ty) || 0
    };
    saveRealmImageTransforms();
}

function clearImageTransform(realm, index) {
    if (!realm || !Number.isFinite(index)) return;
    if (Array.isArray(realmImageTransforms[realm])) {
        realmImageTransforms[realm].splice(index, 1);
        saveRealmImageTransforms();
    }
}

function getCustomTextColor(realm, index) {
    if (!realm) return '';
    const arr = realmTextColors[realm];
    const idx = Number.isFinite(index) ? index : 0;
    if (!Array.isArray(arr)) return '';
    return normalizeHexColor(arr[idx] || '');
}

function setSvgTextFillPreserveStyle(el, color, ensureClickable) {
    if (!el) return;
    const c = normalizeHexColor(color) || '#ffffff';
    el.setAttribute('fill', c);
    const style = (el.getAttribute('style') || '').toString();
    let s = style.replace(/fill:\s*[^;]+;?/gi, '').trim();
    if (ensureClickable) {
        s = s.replace(/pointer-events:\s*[^;]+;?/gi, '').replace(/cursor:\s*[^;]+;?/gi, '').trim();
        s = `pointer-events: all; cursor: pointer; ${s}`.trim();
    }
    if (s && !s.endsWith(';')) s += ';';
    s += ` fill: ${c};`;
    el.setAttribute('style', s);
}

// 保存图片数据到本地存储
function saveRealmImages() {
    try {
        localStorage.setItem('realmImages', JSON.stringify(realmImages));
        
        // 如果是游客模式，标记图片数据为游客数据
        const guestData = localStorage.getItem('guestData');
        if (guestData) {
            const data = JSON.parse(guestData);
            if (data.isGuest) {
                // 更新游客数据的最后更新时间
                data.lastUpdateTime = new Date().toISOString();
                localStorage.setItem('guestData', JSON.stringify(data));
            }
        }
        
        console.log('✅ 已保存选项图片数据');
    } catch (error) {
        console.error('❌ 保存选项图片数据失败:', error);
    }
}

// 保存思念文字和生卒年数据到本地存储
function saveRealmThoughtTexts() {
    try {
        localStorage.setItem('realmThoughtTexts', JSON.stringify(realmThoughtTexts));
        localStorage.setItem('realmBirthDeath', JSON.stringify(realmBirthDeath));
        
        // 如果是游客模式，标记数据为游客数据
        const guestData = localStorage.getItem('guestData');
        if (guestData) {
            const data = JSON.parse(guestData);
            if (data.isGuest) {
                data.lastUpdateTime = new Date().toISOString();
                localStorage.setItem('guestData', JSON.stringify(data));
            }
        }
        
        console.log('✅ 已保存选项思念文字和生卒年数据');
    } catch (error) {
        console.error('❌ 保存选项思念文字和生卒年数据失败:', error);
    }
}

// 查找第一个空位（单个图片位置）
function findEmptySlot() {
    const img = document.querySelector(`.slot-image[data-slot="1"]`);
    if (!img || img.style.display === 'none' || !img.src || img.src === '') {
        return 1;
    }
    return null;
}

// 统计已填充的位置数量
function countFilledSlots() {
    const img = document.querySelector(`.slot-image[data-slot="1"]`);
    if (img && img.style.display !== 'none' && img.src && img.src !== '') {
        return 1;
    }
    return 0;
}

// 检查是否所有位置都已填充
function isAllSlotsFilled() {
    return countFilledSlots() === 1;
}

// 处理图片上传
function handleImageUpload(file) {
    if (!file) {
        console.error('❌ 文件对象为空');
        return;
    }
    
    // 检查当前选中的选项
    if (!currentSelectedButton) {
        console.error('❌ 没有选中的选项');
        alert('请先选择一个选项（天堂、净土、祖先或永恒）');
        return;
    }
    
    // 检查当前选中的按钮是否被锁定，如果锁定则直接返回，不显示任何提示
    if (isButtonLocked(currentSelectedButton)) {
        console.log('按钮已被锁定，无法添加图片');
        return;
    }
    
    console.log('📤 开始处理图片上传:', file.name, '→ 选项', currentSelectedButton);
    
    // 检查文件类型
    if (!file.type || !file.type.startsWith('image/')) {
        console.error('❌ 文件类型不正确:', file.type, '文件:', file.name);
        alert(`文件 "${file.name}" 不是有效的图片文件，已跳过`);
        return;
    }
    
    console.log('📖 开始读取图片文件...');
    
    // 创建FileReader读取图片
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const imageDataUrl = e.target.result;
        console.log('✅ 图片读取成功，显示处理选择对话框');
        
        // 显示图片处理选择对话框，传入当前选中的选项
        showImageProcessModal(imageDataUrl, currentSelectedButton);
    };
    
    reader.onerror = function() {
        console.error('❌ 读取图片失败:', file.name);
        alert(`读取图片 "${file.name}" 失败，请重试`);
    };
    
    reader.readAsDataURL(file);
}

// 显示图片处理选择对话框
function showImageProcessModal(imageDataUrl, targetRealm) {
    const modal = document.getElementById('image-process-modal');
    const originalBtn = document.getElementById('process-original');
    const grayscaleBtn = document.getElementById('process-grayscale');
    
    if (!modal || !originalBtn || !grayscaleBtn) {
        console.error('❌ 图片处理对话框元素未找到');
        // 如果对话框不存在，直接使用原图
        addImageToRealm(targetRealm, imageDataUrl);
        return;
    }
    
    // 显示对话框
    modal.style.display = 'flex';
    
    // 清除之前的事件监听器
    const newOriginalBtn = originalBtn.cloneNode(true);
    const newGrayscaleBtn = grayscaleBtn.cloneNode(true);
    originalBtn.parentNode.replaceChild(newOriginalBtn, originalBtn);
    grayscaleBtn.parentNode.replaceChild(newGrayscaleBtn, grayscaleBtn);
    
    // 绑定原彩按钮事件
    newOriginalBtn.addEventListener('click', function() {
        console.log('✅ 用户选择：原彩');
        closeImageProcessModal();
        addImageToRealm(targetRealm, imageDataUrl);
    });
    
    // 绑定黑白按钮事件
    newGrayscaleBtn.addEventListener('click', function() {
        console.log('✅ 用户选择：黑白');
        closeImageProcessModal();
        convertToGrayscale(imageDataUrl, function(grayscaleDataUrl) {
            addImageToRealm(targetRealm, grayscaleDataUrl);
        });
    });
}

// 关闭图片处理对话框
function closeImageProcessModal() {
    const modal = document.getElementById('image-process-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 初始化图片处理对话框事件（点击外部关闭）
function initImageProcessModal() {
    const modal = document.getElementById('image-process-modal');
    if (modal) {
        // 点击对话框外部关闭
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeImageProcessModal();
            }
        });
    }
}

// 将图片转换为黑白
function convertToGrayscale(imageDataUrl, callback) {
    const img = new Image();
    
    img.onload = function() {
        // 创建canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 设置canvas尺寸
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 绘制图片到canvas
        ctx.drawImage(img, 0, 0);
        
        // 获取图片数据
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // 转换为灰度
        for (let i = 0; i < data.length; i += 4) {
            // 使用标准灰度公式：Y = 0.299*R + 0.587*G + 0.114*B
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i] = gray;     // R
            data[i + 1] = gray; // G
            data[i + 2] = gray; // B
            // data[i + 3] 是 alpha，保持不变
        }
        
        // 将处理后的数据写回canvas
        ctx.putImageData(imageData, 0, 0);
        
        // 转换为data URL
        const grayscaleDataUrl = canvas.toDataURL('image/png');
        console.log('✅ 图片已转换为黑白');
        
        // 调用回调函数
        if (callback) {
            callback(grayscaleDataUrl);
        }
    };
    
    img.onerror = function() {
        console.error('❌ 图片加载失败，无法转换为黑白');
        // 如果转换失败，使用原图
        if (callback) {
            callback(imageDataUrl);
        }
    };
    
    img.src = imageDataUrl;
}

// 添加图片到指定选项
function addImageToRealm(realm, imageDataUrl) {
    console.log('🖼️ 开始添加图片到选项', realm);
    
    // 确保数组存在
    if (!Array.isArray(realmImages[realm])) {
        realmImages[realm] = [];
    }
    
    // 如果已满7张，提示用户
    if (realmImages[realm].length >= 7) {
        alert('该选项最多只能上传7张图片');
        return;
    }
    
    // 添加图片到数组
    realmImages[realm].push(imageDataUrl);
    
    // 如果是第一张图片，设置为当前显示
    if (realmImages[realm].length === 1) {
        realmCurrentImageIndex[realm] = 0;
    }
    
    saveRealmImages();
    
    // 如果当前选中的就是这个选项，立即更新显示
    if (currentSelectedButton === realm) {
        // 显示最新添加的图片
        realmCurrentImageIndex[realm] = realmImages[realm].length - 1;
        switchRealmImage(realm);
    } else {
        console.log('✅ 图片已保存到选项', realm, '，当前未选中该选项，不显示');
    }
}

// 添加图片到指定位置（保留原函数，用于显示）
function addImageToSlot(slotNumber, imageDataUrl) {
    console.log('🖼️ 开始添加图片到位置', slotNumber);
    
    const container = document.querySelector(`.image-container[data-slot="${slotNumber}"]`);
    const img = document.querySelector(`.slot-image[data-slot="${slotNumber}"]`);
    
    if (!container || !img) {
        console.error('❌ 找不到位置', slotNumber, '的容器或图片元素');
        return;
    }
    
    // 处理图片加载的函数
    const processImage = function(currentImg) {
        const imgToProcess = currentImg || img;
        console.log('✅ 图片加载完成，开始调整位置', slotNumber);
        const realm = currentSelectedButton;
        const idx = realm ? (realmCurrentImageIndex[realm] || 0) : 0;
        adjustImageInSlot(slotNumber, imgToProcess, container, realm, idx);
        console.log('✅ 图片已成功添加到位置', slotNumber);
    };
    
    // 清除之前的事件监听器（如果有）
    img.onload = null;
    img.onerror = null;
    
    // 设置错误处理
    img.onerror = function() {
        console.error('❌ 图片加载失败，位置', slotNumber);
        img.style.display = 'none';
    };
    
    // 设置图片源
    img.src = imageDataUrl;
    img.style.display = 'block';
    
    // 隐藏领域图标（当有图片时）
    const iconContainer = document.getElementById('realm-icon-container');
    if (iconContainer) {
        iconContainer.style.display = 'none';
    }
    
    // 显示删除按钮
    const removeBtn = document.querySelector(`.image-remove-btn[data-slot="${slotNumber}"]`);
    if (removeBtn) {
        removeBtn.style.display = 'block';
        removeBtn.style.visibility = 'visible';
        removeBtn.style.opacity = '1';
        // 确保按钮已绑定事件
        if (removeBtn.dataset.bound !== 'true') {
            removeBtn.dataset.bound = 'true';
            removeBtn.addEventListener('click', function(e) {
                // 只阻止事件冒泡到图片，不影响图片的双击事件
                e.stopPropagation();
                console.log('🗑️ 删除位置', slotNumber, '的图片');
                removeImageFromSlot(slotNumber);
            });
            // 也添加触摸事件支持
            removeBtn.addEventListener('touchend', function(e) {
                // 只阻止事件冒泡到图片，不影响图片的双击事件
                e.stopPropagation();
                console.log('🗑️ 触摸删除位置', slotNumber, '的图片');
                removeImageFromSlot(slotNumber);
            }, { passive: false });
        }
        console.log('✅ 删除按钮已显示，位置', slotNumber);
    } else {
        console.error('❌ 找不到位置', slotNumber, '的删除按钮');
    }
    
    // 对于data URL，图片通常立即可用
    // 使用setTimeout确保DOM更新完成
    setTimeout(function() {
        // 重新获取img元素（如果被删除后重新添加，可能是新的元素）
        const currentImg = document.querySelector(`.slot-image[data-slot="${slotNumber}"]`);
        if (!currentImg) {
            console.error('❌ 找不到图片元素');
            return;
        }
        
        if (currentImg.complete && currentImg.naturalWidth > 0) {
            console.log('⚡ 图片立即可用');
            processImage(currentImg);
            // 再次确保删除按钮显示
            if (removeBtn) {
                removeBtn.style.display = 'block';
                removeBtn.style.visibility = 'visible';
                removeBtn.style.opacity = '1';
            }
        } else {
            // 等待图片加载
            currentImg.onload = function() {
                processImage(currentImg);
                // 图片加载完成后，再次确保删除按钮显示
                if (removeBtn) {
                    removeBtn.style.display = 'block';
                    removeBtn.style.visibility = 'visible';
                    removeBtn.style.opacity = '1';
                }
            };
        }
    }, 0);
}

// 调整图片在容器中的大小和位置（保持宽高比）
function adjustImageInSlot(slotNumber, img, container, realm, index) {
    // 容器尺寸（单个图片位置：393 x 573.113，简单矩形，左右贴边）
    const containerWidth = (container && (container.clientWidth || container.offsetWidth)) || 393;
    const containerHeight = (container && (container.clientHeight || container.offsetHeight)) || 573.113;
    
    // 等待图片加载完成
    if (!img.complete || img.naturalWidth === 0) {
        setTimeout(() => adjustImageInSlot(slotNumber, img, container, realm, index), 50);
        return;
    }
    
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    
    if (imgWidth === 0 || imgHeight === 0) {
        console.error('图片尺寸无效');
        return;
    }
    
    // 计算缩放比例，确保图片填满容器（cover模式）
    const scaleX = containerWidth / imgWidth;
    const scaleY = containerHeight / imgHeight;
    const scale = Math.max(scaleX, scaleY); // 取较大的比例，确保填满容器
    
    // 设置图片尺寸（填满容器）
    const displayWidth = imgWidth * scale;
    const displayHeight = imgHeight * scale;
    
    img.style.width = displayWidth + 'px';
    img.style.height = displayHeight + 'px';
    img.style.objectFit = 'cover'; // 使用 cover 模式填满容器
    img.style.transformOrigin = '0 0';
    img.style.transform = 'translate(0px, 0px) scale(1)';
    
    // 居中显示（图片可能超出容器，但会居中，超出部分会被裁剪）
    const left = (containerWidth - displayWidth) / 2;
    const top = (containerHeight - displayHeight) / 2;
    
    img.style.left = left + 'px';
    img.style.top = top + 'px';
    
    // 保存初始位置和尺寸（供手势缩放/拖拽使用）
    img.dataset.initialLeft = left;
    img.dataset.initialTop = top;
    img.dataset.initialWidth = displayWidth;
    img.dataset.initialHeight = displayHeight;
    img.dataset.containerWidth = containerWidth;
    img.dataset.containerHeight = containerHeight;
    img.dataset.scale = '1';
    img.dataset.translateX = '0';
    img.dataset.translateY = '0';
    console.log('图片已调整到位置', slotNumber, '尺寸:', displayWidth.toFixed(2), 'x', displayHeight.toFixed(2));

    // 应用已保存的构图（如果有）
    if (realm && Number.isFinite(index)) {
        applySavedTransformToImage(img, container, realm, index);
    }
    
    // 检测图片亮度并调整删除按钮颜色
    detectImageBrightnessAndAdjustButton(slotNumber, img);

    // “这世界我来过”根据底图自适应黑/白（仅主图 slot=1）
    if (slotNumber === 1) {
        setTimeout(() => {
            try { adjustImageSlotNoteTextColor(); } catch (_) {}
        }, 0);
    }

    // 允许双指缩放/拖拽（仅主图）
    if (slotNumber === 1) {
        enablePinchZoomForImage(img, container, realm, index);
    }
}

function clampImageTranslate(baseLeft, baseTop, baseWidth, baseHeight, containerWidth, containerHeight, scale, tx, ty) {
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const scaledW = baseWidth * scale;
    const scaledH = baseHeight * scale;
    const minLeft = containerWidth - scaledW;
    const maxLeft = 0;
    const minTop = containerHeight - scaledH;
    const maxTop = 0;
    const clampedLeft = clamp(baseLeft + tx, minLeft, maxLeft);
    const clampedTop = clamp(baseTop + ty, minTop, maxTop);
    return {
        tx: clampedLeft - baseLeft,
        ty: clampedTop - baseTop
    };
}

function applySavedTransformToImage(img, container, realm, index) {
    if (!img || !container) return;
    const t = getImageTransform(realm, index);
    if (!t) return;
    const baseLeft = parseFloat(img.dataset.initialLeft || '0');
    const baseTop = parseFloat(img.dataset.initialTop || '0');
    const baseWidth = parseFloat(img.dataset.initialWidth || '0');
    const baseHeight = parseFloat(img.dataset.initialHeight || '0');
    const containerWidth = container.clientWidth || parseFloat(img.dataset.containerWidth || '0');
    const containerHeight = container.clientHeight || parseFloat(img.dataset.containerHeight || '0');
    if (!baseWidth || !baseHeight || !containerWidth || !containerHeight) return;
    const clamped = clampImageTranslate(baseLeft, baseTop, baseWidth, baseHeight, containerWidth, containerHeight, t.scale, t.tx, t.ty);
    img.dataset.scale = String(t.scale);
    img.dataset.translateX = String(clamped.tx);
    img.dataset.translateY = String(clamped.ty);
    img.style.transform = `translate(${clamped.tx}px, ${clamped.ty}px) scale(${t.scale})`;
}

// 双指缩放 + 单指拖拽（图片超出容器裁切）
function enablePinchZoomForImage(img, container, realm, index) {
    if (!img || !container) return;
    if (img.dataset.pinchBound === 'true') return;
    img.dataset.pinchBound = 'true';
    img.style.touchAction = 'none';

    const state = {
        mode: null, // 'pan' | 'pinch'
        startX: 0,
        startY: 0,
        startTx: 0,
        startTy: 0,
        startScale: 1,
        startDist: 0,
        startCenterX: 0,
        startCenterY: 0
    };

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const getBase = () => ({
        baseLeft: parseFloat(img.dataset.initialLeft || '0'),
        baseTop: parseFloat(img.dataset.initialTop || '0'),
        baseWidth: parseFloat(img.dataset.initialWidth || '0'),
        baseHeight: parseFloat(img.dataset.initialHeight || '0'),
        containerWidth: container.clientWidth || parseFloat(img.dataset.containerWidth || '0'),
        containerHeight: container.clientHeight || parseFloat(img.dataset.containerHeight || '0')
    });

    const applyTransform = (scale, tx, ty) => {
        img.dataset.scale = String(scale);
        img.dataset.translateX = String(tx);
        img.dataset.translateY = String(ty);
        img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    };

    const clampTranslate = (scale, tx, ty) => {
        const { baseLeft, baseTop, baseWidth, baseHeight, containerWidth, containerHeight } = getBase();
        const scaledW = baseWidth * scale;
        const scaledH = baseHeight * scale;
        const minLeft = containerWidth - scaledW;
        const maxLeft = 0;
        const minTop = containerHeight - scaledH;
        const maxTop = 0;
        const clampedLeft = clamp(baseLeft + tx, minLeft, maxLeft);
        const clampedTop = clamp(baseTop + ty, minTop, maxTop);
        return {
            tx: clampedLeft - baseLeft,
            ty: clampedTop - baseTop
        };
    };

    const onTouchStart = (e) => {
        if (!img.src) return;
        if (e.touches.length === 2) {
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const dx = t2.clientX - t1.clientX;
            const dy = t2.clientY - t1.clientY;
            state.mode = 'pinch';
            state.startDist = Math.hypot(dx, dy);
            state.startScale = parseFloat(img.dataset.scale || '1');
            state.startTx = parseFloat(img.dataset.translateX || '0');
            state.startTy = parseFloat(img.dataset.translateY || '0');
            const rect = container.getBoundingClientRect();
            state.startCenterX = (t1.clientX + t2.clientX) / 2 - rect.left;
            state.startCenterY = (t1.clientY + t2.clientY) / 2 - rect.top;
            e.preventDefault();
        } else if (e.touches.length === 1) {
            state.mode = 'pan';
            state.startX = e.touches[0].clientX;
            state.startY = e.touches[0].clientY;
            state.startTx = parseFloat(img.dataset.translateX || '0');
            state.startTy = parseFloat(img.dataset.translateY || '0');
            e.preventDefault();
        }
    };

    const onTouchMove = (e) => {
        if (!img.src) return;
        if (state.mode === 'pinch' && e.touches.length >= 2) {
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const dx = t2.clientX - t1.clientX;
            const dy = t2.clientY - t1.clientY;
            const dist = Math.hypot(dx, dy);
            if (!state.startDist) return;
            const scaleRatio = dist / state.startDist;
            const newScale = clamp(state.startScale * scaleRatio, 1, 4);

            const rect = container.getBoundingClientRect();
            const centerX = (t1.clientX + t2.clientX) / 2 - rect.left;
            const centerY = (t1.clientY + t2.clientY) / 2 - rect.top;
            const { baseLeft, baseTop } = getBase();

            const imgX = (state.startCenterX - baseLeft - state.startTx) / state.startScale;
            const imgY = (state.startCenterY - baseTop - state.startTy) / state.startScale;
            let tx = centerX - baseLeft - imgX * newScale;
            let ty = centerY - baseTop - imgY * newScale;

            const clamped = clampTranslate(newScale, tx, ty);
            applyTransform(newScale, clamped.tx, clamped.ty);
            e.preventDefault();
        } else if (state.mode === 'pan' && e.touches.length === 1) {
            const dx = e.touches[0].clientX - state.startX;
            const dy = e.touches[0].clientY - state.startY;
            const scale = parseFloat(img.dataset.scale || '1');
            const clamped = clampTranslate(scale, state.startTx + dx, state.startTy + dy);
            applyTransform(scale, clamped.tx, clamped.ty);
            e.preventDefault();
        }
    };

    const onTouchEnd = () => {
        if (img.dataset.scale === '0') {
            applyTransform(1, 0, 0);
        }
        const activeRealm = realm || currentSelectedButton;
        const activeIndex = Number.isFinite(index) ? index : (activeRealm ? (realmCurrentImageIndex[activeRealm] || 0) : 0);
        if (activeRealm) {
            const scale = parseFloat(img.dataset.scale || '1');
            const tx = parseFloat(img.dataset.translateX || '0');
            const ty = parseFloat(img.dataset.translateY || '0');
            setImageTransform(activeRealm, activeIndex, { scale, tx, ty });
        }
        state.mode = null;
        state.startDist = 0;
    };

    img.addEventListener('touchstart', onTouchStart, { passive: false });
    img.addEventListener('touchmove', onTouchMove, { passive: false });
    img.addEventListener('touchend', onTouchEnd, { passive: true });
    img.addEventListener('touchcancel', onTouchEnd, { passive: true });
}

// 在图片上按元素位置取样亮度（用于按钮黑/白自适应）
function sampleImageBrightnessNearElement(img, targetEl) {
    if (!img || !targetEl) return null;
    if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) return null;

    try {
        const imgRect = img.getBoundingClientRect();
        const tRect = targetEl.getBoundingClientRect();
        const cx = tRect.left + tRect.width * 0.5;
        const cy = tRect.top + tRect.height * 0.5;

        if (!imgRect.width || !imgRect.height) return null;

        const clamp01 = (n) => Math.max(0, Math.min(1, n));
        const rx = clamp01((cx - imgRect.left) / imgRect.width);
        const ry = clamp01((cy - imgRect.top) / imgRect.height);

        const sx = rx * img.naturalWidth;
        const sy = ry * img.naturalHeight;
        const sampleW = Math.max(40, Math.min(220, img.naturalWidth * 0.2));
        const sampleH = Math.max(30, Math.min(160, img.naturalHeight * 0.16));
        const sourceX = Math.max(0, Math.min(img.naturalWidth - sampleW, sx - sampleW / 2));
        const sourceY = Math.max(0, Math.min(img.naturalHeight - sampleH, sy - sampleH / 2));

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 90;
        canvas.height = 70;
        ctx.drawImage(img, sourceX, sourceY, sampleW, sampleH, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let total = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3];
            if (a <= 0) continue;
            const r = data[i], g = data[i + 1], b = data[i + 2];
            total += 0.299 * r + 0.587 * g + 0.114 * b;
            count++;
        }
        if (!count) return null;
        return total / count;
    } catch (_) {
        return null;
    }
}

// 检测图片亮度并调整删除按钮颜色
function detectImageBrightnessAndAdjustButton(slotNumber, img) {
    const removeBtn = document.querySelector(`.image-remove-btn[data-slot="${slotNumber}"]`);
    const fullscreenBtn = document.getElementById('fullscreen-icon-btn') || document.getElementById('fullscreen-icon');
    if (!removeBtn && !fullscreenBtn) {
        console.log('未找到需要调整的按钮，跳过亮度检测');
        return;
    }
    
    // 创建 canvas 来分析图片
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 设置 canvas 尺寸（使用较小的尺寸以提高性能）
    const sampleSize = 100; // 采样尺寸
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    
    // 绘制图片到 canvas（缩放到采样尺寸）
    try {
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        
        // 获取图片数据
        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const data = imageData.data;
        
        // 计算平均亮度
        let totalBrightness = 0;
        let pixelCount = 0;
        
        // 遍历像素（每4个值代表一个像素：R, G, B, A）
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // 只计算不透明的像素
            if (a > 0) {
                // 使用标准亮度公式：Y = 0.299*R + 0.587*G + 0.114*B
                const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
                totalBrightness += brightness;
                pixelCount++;
            }
        }
        
        if (pixelCount === 0) {
            console.log('无法计算亮度，保持默认颜色');
            return;
        }
        
        const averageBrightness = totalBrightness / pixelCount;
        console.log('图片平均亮度:', averageBrightness.toFixed(2));
        
        // 默认：整体亮度；优先：按按钮附近取样
        const fallbackColor = averageBrightness > 128 ? '#000000' : '#ffffff';

        if (removeBtn) {
            const near = sampleImageBrightnessNearElement(img, removeBtn);
            const c = (near == null ? averageBrightness : near) > 128 ? '#000000' : '#ffffff';
            removeBtn.style.setProperty('border-color', c, 'important');
            removeBtn.style.setProperty('color', c, 'important');
        }
        if (fullscreenBtn) {
            const near = sampleImageBrightnessNearElement(img, fullscreenBtn);
            const c = (near == null ? averageBrightness : near) > 128 ? '#000000' : '#ffffff';
            fullscreenBtn.style.color = c;
            const svgPaths = fullscreenBtn.querySelectorAll('.st0');
            svgPaths.forEach((p) => { p.style.fill = c; });
        }
        console.log(`✅ 检测到${averageBrightness > 128 ? '浅色' : '深色'}图片，按钮颜色已切换`);
    } catch (error) {
        console.error('❌ 亮度检测失败:', error);
        // 出错时保持默认白色
        if (removeBtn) {
            removeBtn.style.setProperty('border-color', '#ffffff', 'important');
            removeBtn.style.setProperty('color', '#ffffff', 'important');
        }
        if (fullscreenBtn) {
            fullscreenBtn.style.color = '#ffffff';
            const svgPaths = fullscreenBtn.querySelectorAll('.st0');
            svgPaths.forEach((p) => { p.style.fill = '#ffffff'; });
        }
    }
}

// 图片拖拽和放大功能已移除，图片自动填满容器

// ===== 首次安装：默认自定义图片（自动黑白）=====
const DEFAULT_CUSTOM_IMAGE_ASSET_URL = '张国荣.jpg';
// 每次更换默认初始图都更新此ID，用于自动升级“旧默认图”
const DEFAULT_CUSTOM_IMAGE_ID = '2026-02-06-zhang-guorong';

function isRealmImagesStorageEmptyOrMissing() {
    try {
        const saved = localStorage.getItem('realmImages');
        if (!saved) return true;
        const parsed = JSON.parse(saved);
        const realms = ['heaven', 'paradise', 'ancestors', 'eternal'];
        return realms.every((r) => {
            const arr = parsed ? parsed[r] : null;
            if (typeof arr === 'string') return !arr;
            if (Array.isArray(arr)) return !arr.some((x) => typeof x === 'string' && x);
            return true;
        });
    } catch (_) {
        return true;
    }
}

function loadAssetImageAsDataURL(url) {
    // 1) 优先 fetch + FileReader（兼容 WebView / 浏览器）
    // 2) 失败时退回 Image + canvas
    return new Promise((resolve, reject) => {
        try {
            fetch(url)
                .then((r) => {
                    if (!r.ok) throw new Error('fetch not ok');
                    return r.blob();
                })
                .then((blob) => {
                    const fr = new FileReader();
                    fr.onload = () => resolve(fr.result);
                    fr.onerror = () => reject(new Error('FileReader failed'));
                    fr.readAsDataURL(blob);
                })
                .catch(() => {
                    const img = new Image();
                    img.onload = () => {
                        try {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            canvas.width = img.naturalWidth || img.width;
                            canvas.height = img.naturalHeight || img.height;
                            ctx.drawImage(img, 0, 0);
                            resolve(canvas.toDataURL('image/png'));
                        } catch (e) {
                            reject(e);
                        }
                    };
                    img.onerror = () => reject(new Error('Image load failed'));
                    img.src = url;
                });
        } catch (e) {
            reject(e);
        }
    });
}

function isRealmImagesAllSameSingleImage(parsed) {
    try {
        if (!parsed || typeof parsed !== 'object') return false;
        const realms = ['heaven', 'paradise', 'ancestors', 'eternal'];
        let first = '';
        for (const r of realms) {
            const v = parsed[r];
            let img = '';
            if (typeof v === 'string') {
                img = v;
            } else if (Array.isArray(v)) {
                img = (v[0] && typeof v[0] === 'string') ? v[0] : '';
            } else {
                img = '';
            }
            if (!img) return false;
            if (!first) first = img;
            if (img !== first) return false;
        }
        return !!first;
    } catch (_) {
        return false;
    }
}

function maybeInitDefaultCustomImage() {
    let shouldInit = false;
    let parsed = null;

    try {
        const saved = localStorage.getItem('realmImages');
        if (!saved) {
            shouldInit = true;
        } else {
            parsed = JSON.parse(saved);
        }
    } catch (_) {
        shouldInit = true;
    }

    // 没有任何图片数据：初始化默认图
    if (!shouldInit) {
        shouldInit = isRealmImagesStorageEmptyOrMissing();
    }

    // 自动升级：如果当前存的看起来仍是“旧默认图”（四个 realm 都是同一张单图），就用新默认图覆盖
    if (!shouldInit) {
        try {
            const savedId = localStorage.getItem('defaultCustomImageId') || '';
            if (savedId !== DEFAULT_CUSTOM_IMAGE_ID && isRealmImagesAllSameSingleImage(parsed)) {
                shouldInit = true;
            }
        } catch (_) {}
    }

    if (!shouldInit) return;

    loadAssetImageAsDataURL(DEFAULT_CUSTOM_IMAGE_ASSET_URL)
        .then((dataUrl) => new Promise((resolve) => convertToGrayscale(dataUrl, resolve)))
        .then((grayDataUrl) => {
            const payload = {
                heaven: [grayDataUrl],
                paradise: [grayDataUrl],
                ancestors: [grayDataUrl],
                eternal: [grayDataUrl]
            };
            const idxPayload = { heaven: 0, paradise: 0, ancestors: 0, eternal: 0 };

            try {
                localStorage.setItem('realmImages', JSON.stringify(payload));
                localStorage.setItem('realmCurrentImageIndex', JSON.stringify(idxPayload));
                localStorage.setItem('defaultCustomImageInitialized', '1');
                localStorage.setItem('defaultCustomImageId', DEFAULT_CUSTOM_IMAGE_ID);
            } catch (_) {}

            // 同步到内存对象（如果已初始化）
            try {
                Object.keys(realmImages).forEach((k) => { realmImages[k] = payload[k].slice(0, 7); });
                Object.keys(realmCurrentImageIndex).forEach((k) => { realmCurrentImageIndex[k] = 0; });
            } catch (_) {}

            // 如果 UI 已准备好，刷新显示
            try {
                const realm = currentSelectedButton || 'heaven';
                switchRealmImage(realm);
                adjustThoughtTextColor();
                adjustImageSlotNoteTextColor();
            } catch (_) {}
        })
        .catch(() => {
            // 忽略：默认图加载失败时保持空白
        });
}

// 页面初始化
function initApp() {
    console.log('初始化应用...');

    // 截图分享查看模式：?shot=...
    const shotToken = getShotTokenFromLocation();
    if (shotToken) {
        initShotViewer(shotToken);
        return;
    }

    // 分享演示模式：通过链接直接打开第二页，只读观看
    const sharePayload = getSharePayloadFromLocation();
    if (sharePayload) {
        initShareViewer(sharePayload);
        return;
    }

    // 首次安装：如果没有任何图片数据，自动加载内置默认自定义图（黑白）
    maybeInitDefaultCustomImage();
    
    // 检查并清理过期的游客数据
    checkAndCleanGuestData();
    
    // 显示用户信息（注册用户显示用户名，游客显示游客信息）
    displayUserInfo();
    
    // 初始化添加图片按钮
    initAddImageButton();
    // 初始化图片删除按钮
    initImageRemoveButtons();
    // 初始化图片处理对话框
    initImageProcessModal();
    // 初始化小图框交互
    initThumbnails();
    // 初始化思念文字功能
    initThoughtText();
    // 初始化全屏功能
    initFullscreen();
    // 注册图标与“云归”底对齐
    setTimeout(alignRegisterIconToYunGuiBottom, 0);
    // 顶部品牌区：与主图右边缘对齐
    setTimeout(alignTopBrandingToImageRightEdge, 0);
    
    // 初始化图片
    loadImages();
    
    // 检查注册状态（在SVG加载前就可以检查）
    checkRegistrationStatus();
    
    // 尝试从本地存储加载位置
    const savedLocation = loadLocationFromStorage();
    
    // 如果本地存储有位置且不超过1小时，使用缓存
    if (savedLocation && savedLocation.timestamp) {
        const age = Date.now() - savedLocation.timestamp;
        if (age < 3600000) { // 1小时内
            console.log('使用缓存的位置信息');
        } else {
            // 缓存过期，重新获取
            getCurrentLocation();
        }
    } else {
        // 没有缓存，获取当前位置
        getCurrentLocation();
    }
    
    // 立即尝试绑定注册按钮（不等待其他元素）
    bindRegisterButton();
    
    // 等待SVG加载完成后再初始化按钮
    const checkSVGLoaded = setInterval(function() {
        const buttons = document.querySelectorAll('.nav-button-group');
        const registerButton = document.querySelector('.register-button');
        const locationIcon = document.querySelector('.location-icon-clickable');
        
        if (buttons.length > 0 && registerButton && locationIcon) {
            console.log('SVG已加载，找到', buttons.length, '个按钮');
            clearInterval(checkSVGLoaded);
            
            // 初始化按钮选中状态
            initButtonSelection();
            
            // 添加按钮点击事件
            setupButtonEvents();
            
            // 初始化添加图片按钮
            initAddImageButton();
            initImageRemoveButtons();
            
            // 添加位置图标点击事件 - 重新定位
            if (!locationIcon.hasAttribute('data-bound')) {
                locationIcon.setAttribute('data-bound', 'true');
                locationIcon.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('点击位置图标，重新定位');
                    updateLocationText('定位中...');
                    getCurrentLocation();
                });
                
                // 添加位置图标触摸事件
                locationIcon.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    this.style.opacity = '0.7';
                }, { passive: false });
                
                locationIcon.addEventListener('touchend', function(e) {
                    e.preventDefault();
                    setTimeout(() => {
                        this.style.opacity = '1';
                    }, 100);
                }, { passive: false });
            }
            
            // 确保注册按钮已绑定（使用独立函数）
            bindRegisterButton();
            // 顶部品牌区：与主图右边缘对齐（再执行一次，避免字体/渲染时机导致误差）
            setTimeout(alignTopBrandingToImageRightEdge, 50);
            
            // 初始化全屏功能（确保SVG已加载）
            initFullscreen();
            
            // 再次检查注册状态并更新图标颜色（确保SVG已加载）
            setTimeout(() => {
                checkRegistrationStatus();
            }, 100);
        } else {
            console.log('等待SVG加载...', {
                buttons: buttons.length,
                registerButton: !!registerButton,
                locationIcon: !!locationIcon
            });
        }
    }, 50);
    
    // 最多等待5秒
    setTimeout(function() {
        clearInterval(checkSVGLoaded);
        const buttons = document.querySelectorAll('.nav-button-group');
        const registerButton = document.querySelector('.register-button');
        const locationIcon = document.querySelector('.location-icon-clickable');
        
        if (buttons.length === 0 || !registerButton || !locationIcon) {
            console.error('SVG加载超时，强制初始化');
            // 强制初始化
            initButtonSelection();
            setupButtonEvents();
            
            // 强制绑定注册按钮（使用独立函数）
            bindRegisterButton();
            
            // 强制初始化添加图片按钮
            initAddImageButton();
            initImageRemoveButtons();
            
            // 强制绑定定位按钮
            const locIcon = document.querySelector('.location-icon-clickable');
            
            if (locIcon && !locIcon.hasAttribute('data-bound')) {
                locIcon.setAttribute('data-bound', 'true');
                locIcon.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    updateLocationText('定位中...');
                    getCurrentLocation();
                });
            }
        }
        // 确保注册状态已检查
        checkRegistrationStatus();
    }, 5000);
    
    // 点击弹窗外部关闭
    const registerModal = document.getElementById('register-modal');
    if (registerModal) {
        registerModal.addEventListener('click', function(e) {
            if (e.target === registerModal) {
                closeRegisterModal();
            }
        });
    }
}

// ===== 分享/演示链接（只读第二页）=====
function base64UrlEncode(str) {
    // UTF-8 safe
    const utf8 = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16)));
    const b64 = btoa(utf8);
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(b64url) {
    const b64 = (b64url || '').replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
    const bin = atob(b64 + pad);
    const utf8 = Array.from(bin).map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
    return decodeURIComponent(utf8);
}

function getSharePayloadFromLocation() {
    try {
        // 旧版演示模式（?share=... 或 #share=...）保留兼容
        const url = new URL(window.location.href);
        let token = url.searchParams.get('share');
        if (!token) {
            const hash = window.location.hash || '';
            const m = hash.match(/[#&]share=([^&]+)/);
            token = m ? m[1] : '';
        }
        if (!token) return null;
        const decoded = base64UrlDecode(token);
        const data = JSON.parse(decoded);
        return data && typeof data === 'object' ? data : null;
    } catch (_) {
        return null;
    }
}

// 新版：截图分享（?shot=...）
function getShotTokenFromLocation() {
    try {
        const url = new URL(window.location.href);
        const token = url.searchParams.get('shot');
        return token || '';
    } catch (_) {
        return '';
    }
}

function base64UrlToBase64(b64url) {
    const b64 = (b64url || '').replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
    return b64 + pad;
}

function initShotViewer(shotToken) {
    try {
        if (!shotToken) return;
        document.body.classList.add('share-view');
        document.documentElement.classList.add('fullscreen-open');
        document.body.classList.add('fullscreen-open');

        const fullscreenModal = document.getElementById('fullscreen-modal');
        if (fullscreenModal) fullscreenModal.style.display = 'flex';
        isFullscreen = true;

        const fullscreenContent = document.getElementById('fullscreen-content');
        if (!fullscreenContent) return;
        fullscreenContent.innerHTML = '';
        fullscreenContent.style.display = 'flex';
        fullscreenContent.style.alignItems = 'center';
        fullscreenContent.style.justifyContent = 'center';

        const img = document.createElement('img');
        img.alt = '分享截图';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.display = 'block';
        img.style.objectFit = 'contain';
        img.style.margin = '0';
        img.src = `data:image/jpeg;base64,${base64UrlToBase64(shotToken)}`;
        fullscreenContent.appendChild(img);
        console.log('✅ 已进入截图分享查看模式');
    } catch (_) {}
}

async function copyTextToClipboard(text) {
    if (!text) return false;
    // 优先 Clipboard API（可能因权限/非 https 失败）
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch (_) {}
    // 退化：execCommand copy
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.top = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return !!ok;
    } catch (_) {
        return false;
    }
}

function openShareLinkModal(link) {
    const modal = document.getElementById('share-link-modal');
    const input = document.getElementById('share-link-input');
    const copyBtn = document.getElementById('share-link-copy-btn');
    const previewImg = document.getElementById('share-shot-preview');
    const saveBtn = document.getElementById('share-shot-save-btn');
    if (!modal || !input || !copyBtn) return;
    input.value = link || '';
    // 每次打开默认先隐藏预览（生成完再显示）
    if (previewImg) {
        previewImg.removeAttribute('src');
        previewImg.style.display = 'none';
    }
    modal.style.display = 'flex';
    setTimeout(() => {
        input.focus();
        input.select();
    }, 50);
    if (!copyBtn.hasAttribute('data-bound')) {
        copyBtn.setAttribute('data-bound', 'true');
        copyBtn.addEventListener('click', async () => {
            const ok = await copyTextToClipboard(input.value);
            showToast(ok ? '已复制链接' : '复制失败，请长按输入框手动复制', 1800);
        });
    }

    // 保存截图按钮（如果当前有预览图）
    if (saveBtn && !saveBtn.hasAttribute('data-bound')) {
        saveBtn.setAttribute('data-bound', 'true');
        saveBtn.addEventListener('click', () => {
            const src = previewImg?.getAttribute('src') || '';
            if (!src) {
                showToast('暂无截图可保存', 1600);
                return;
            }
            const a = document.createElement('a');
            a.href = src;
            a.download = `CloudReturn-share-${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }
}

function closeShareLinkModal() {
    const modal = document.getElementById('share-link-modal');
    if (modal) modal.style.display = 'none';
}

function setShareLinkModalText(text) {
    const input = document.getElementById('share-link-input');
    if (input) input.value = text || '';
}

function withTimeout(promise, ms, errorMessage = '操作超时') {
    let t = null;
    const timeout = new Promise((_, reject) => {
        t = setTimeout(() => reject(new Error(errorMessage)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

function buildShareLink(payloadObj) {
    const encoded = base64UrlEncode(JSON.stringify(payloadObj));
    const url = new URL(window.location.href);
    // 清掉 hash，避免被聊天软件吞掉
    url.hash = '';
    url.searchParams.set('share', encoded);
    return url.toString();
}

function buildShotLink(jpegDataUrl) {
    const url = new URL(window.location.href);
    url.hash = '';
    url.searchParams.delete('share');
    const b64 = (jpegDataUrl || '').split(',')[1] || '';
    const token = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    url.searchParams.set('shot', token);
    return url.toString();
}

function makeRegistrationCode() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `CR-${ts}-${rnd}`;
}

async function generateFullscreenScreenshotJpeg(regCode, options = {}) {
    const content = document.getElementById('fullscreen-content');
    if (!content) throw new Error('no fullscreen-content');

    // 轻量等待，避免某些环境 RAF 不触发造成“假等待”
    await new Promise((r) => setTimeout(r, 60));

    // 以 fullscreen-content 的显示区域为基准生成截图（可控大小，避免链接过长）
    const contentRect = content.getBoundingClientRect();
    const targetW = Math.min(320, Math.round(contentRect.width)); // 控制尺寸（更短链接）
    const scale = targetW / contentRect.width;
    const targetH = Math.round(contentRect.height * scale);

    const includeVideosDefault = window.location.protocol !== 'file:';
    const includeVideos = typeof options.includeVideos === 'boolean' ? options.includeVideos : includeVideosDefault;

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no canvas ctx');

    // 背景
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, targetW, targetH);

    const drawElementRect = (el, drawFn) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const x = (r.left - contentRect.left) * scale;
        const y = (r.top - contentRect.top) * scale;
        const w = r.width * scale;
        const h = r.height * scale;
        if (w <= 0 || h <= 0) return;
        drawFn({ x, y, w, h, r });
    };

    // 主图片
    const imgEl = document.getElementById('fullscreen-image');
    drawElementRect(imgEl, ({ x, y, w, h }) => {
        try { ctx.drawImage(imgEl, x, y, w, h); } catch (_) {}
    });

    // 蜡烛区域：尽力绘制视频当前帧（file:// 下很容易污染 canvas 导致导出失败）
    if (includeVideos) {
        const v1 = document.getElementById('fullscreen-candle-video');
        const v5 = document.getElementById('fullscreen-candle-video-5');
        const drawVideo = (v) => {
            if (!v || v.readyState < 2) return;
            drawElementRect(v, ({ x, y, w, h }) => {
                try { ctx.drawImage(v, x, y, w, h); } catch (_) {}
            });
        };
        drawVideo(v1);
        drawVideo(v5);
    }

    // 文字
    const t1 = document.getElementById('fullscreen-thought-text');
    const t2 = document.getElementById('fullscreen-birth-death');
    const drawText = (el) => {
        if (!el) return;
        const text = (el.textContent || '').trim();
        if (!text) return;
        const style = getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize) * scale;
        const fontWeight = style.fontWeight || '700';
        const color = style.color || '#fff';
        drawElementRect(el, ({ x, y, w, h }) => {
            ctx.fillStyle = color;
            ctx.font = `${fontWeight} ${Math.max(10, fontSize)}px -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei","SimHei",sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, x + w / 2, y + h / 2);
        });
    };
    drawText(t1);
    drawText(t2);

    // 软件 logo（左上角）
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = `700 ${Math.max(12, 14 * scale)}px -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei","SimHei",sans-serif`;
    ctx.fillText('CloudReturn', 10, 10);
    ctx.font = `700 ${Math.max(12, 16 * scale)}px -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei","SimHei",sans-serif`;
    ctx.fillText('云归', 10, 28);

    // 注册码（左下角）
    ctx.font = `700 ${Math.max(11, 13 * scale)}px -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei","SimHei",sans-serif`;
    ctx.textBaseline = 'bottom';
    ctx.fillText(`注册码 ${regCode}`, 10, targetH - 10);

    // 这里可能会因“被污染的 canvas/安全限制”抛错
    try {
        return canvas.toDataURL('image/jpeg', 0.75);
    } catch (e) {
        // 可能是视频导致 canvas 被污染：自动降级为不包含视频帧的截图
        if (includeVideos) {
            return await generateFullscreenScreenshotJpeg(regCode, { includeVideos: false });
        }
        throw e;
    }
}

function initShareViewer(payload) {
    try {
        document.body.classList.add('share-view');
        document.documentElement.classList.add('fullscreen-open');
        document.body.classList.add('fullscreen-open');

        const fullscreenModal = document.getElementById('fullscreen-modal');
        const fullscreenImage = document.getElementById('fullscreen-image');
        const fullscreenThoughtText = document.getElementById('fullscreen-thought-text');
        const fullscreenBirthDeath = document.getElementById('fullscreen-birth-death');
        const candleVideo = document.getElementById('fullscreen-candle-video');
        const candleVideo5 = document.getElementById('fullscreen-candle-video-5');

        if (fullscreenModal) fullscreenModal.style.display = 'flex';
        isFullscreen = true;

        if (fullscreenImage && payload.img) {
            fullscreenImage.src = payload.img;
            fullscreenImage.style.display = 'block';
            fullscreenImage.onload = function() {
                adjustFullscreenContentSize();
                layoutFullscreenTextOverlays();
            };
            if (fullscreenImage.complete) {
                adjustFullscreenContentSize();
                layoutFullscreenTextOverlays();
            }
        }

        if (fullscreenThoughtText) {
            fullscreenThoughtText.textContent = (payload.thought || '').toString();
            fullscreenThoughtText.style.display = 'block';
            fullscreenThoughtText.style.visibility = 'visible';
            if (payload.textColor) fullscreenThoughtText.style.color = payload.textColor;
        }
        if (fullscreenBirthDeath) {
            fullscreenBirthDeath.textContent = (payload.birthDeath || '').toString();
            fullscreenBirthDeath.style.display = 'block';
            fullscreenBirthDeath.style.visibility = 'visible';
            if (payload.textColor) fullscreenBirthDeath.style.color = payload.textColor;
        }

        // 蜡烛视频：演示模式也要保持视频播放（不是截图）
        const playVid = (v) => {
            if (!v) return;
            v.style.display = 'block';
            const p = v.play();
            if (p && typeof p.catch === 'function') p.catch(() => {});
        };
        playVid(candleVideo);
        playVid(candleVideo5);

        // 禁止任何初始化逻辑写入/绑定（只读）
        console.log('✅ 已进入分享演示模式（只读）');
    } catch (_) {}
}

// 让注册图标底边与“云归”底边对齐（自动计算，不靠猜像素）
function alignRegisterIconToYunGuiBottom() {
    try {
        const registerGroup = document.querySelector('.register-button') || document.getElementById('组_4');
        const yunGuiGroup = document.getElementById('组_6'); // “云归”所在组
        if (!registerGroup || !yunGuiGroup) return;

        const parseTranslate = (t) => {
            const m = (t || '').match(/translate\(\s*([-\d.]+)(?:[ ,]+([-\d.]+))?\s*\)/);
            return { x: m ? parseFloat(m[1]) : 0, y: m && m[2] != null ? parseFloat(m[2]) : 0 };
        };

        const setTranslate = (el, x, y) => {
            el.setAttribute('transform', `translate(${x} ${y})`);
        };

        const { x: rx, y: ry } = parseTranslate(registerGroup.getAttribute('transform'));
        const { y: yy } = parseTranslate(yunGuiGroup.getAttribute('transform'));

        // getBBox 在某些时机可能失败：放到 try 里
        const regBox = registerGroup.getBBox();
        const yunBox = yunGuiGroup.getBBox();

        // getBBox() 返回的是“元素自身坐标系”的 bbox（通常不包含元素自身的 translate）
        // 所以要把 translate(y) 加回去，才能在同一父坐标系里对齐底边
        const regBottomInParent = ry + regBox.y + regBox.height;
        const yunBottomInParent = yy + yunBox.y + yunBox.height;

        // 需求：随着顶部区域整体上移 30px，注册图标也要整体上移
        // 原先：底边 = “云归”底边 + 11px（略向下）
        // 现在：在原基础上上移 30px → 11 - 30 = -19
        const targetBottom = yunBottomInParent - 19;
        const deltaY = targetBottom - regBottomInParent;

        // 防呆：如果计算出离谱的位移，直接不动（避免把图标甩出屏幕）
        if (Number.isFinite(deltaY) && Math.abs(deltaY) > 0.01 && Math.abs(deltaY) < 200) {
            setTranslate(registerGroup, rx, ry + deltaY);
        }
    } catch (_) {}
}

// 顶部品牌区元素：右对齐到主图右边缘（x = 393）
function alignTopBrandingToImageRightEdge() {
    try {
        const targetRight = (NAV_BTN_OVERLAY && typeof NAV_BTN_OVERLAY.frameW === 'number')
            ? (NAV_BTN_OVERLAY.frameX + NAV_BTN_OVERLAY.frameW)
            : 393;

        const parseTranslate = (t) => {
            const m = (t || '').match(/translate\(\s*([-\d.]+)(?:[ ,]+([-\d.]+))?\s*\)/);
            return { x: m ? parseFloat(m[1]) : 0, y: m && m[2] != null ? parseFloat(m[2]) : 0 };
        };

        const setTranslate = (el, x, y) => {
            el.setAttribute('transform', `translate(${x} ${y})`);
        };

        const alignRight = (el, rightOffsetPx = 0) => {
            if (!el) return;
            const { x, y } = parseTranslate(el.getAttribute('transform'));
            const bb = el.getBBox();
            const rightInParent = x + bb.x + bb.width;
            const dx = (targetRight + (rightOffsetPx || 0)) - rightInParent;
            if (Number.isFinite(dx) && Math.abs(dx) > 0.01 && Math.abs(dx) < 300) {
                setTranslate(el, x + dx, y);
            }
        };

        // 这些就是截图里那组“CloudReturn / 云归 / 云朵 / +号”区域
        alignRight(document.getElementById('组_1')); // 云朵
        alignRight(document.getElementById('CloudReturn')); // CloudReturn
        alignRight(document.getElementById('组_6')); // “云归”
        // 上传 + 图标：在右对齐基础上向左偏移 3px
        alignRight(document.getElementById('add-image-button'), -3); // 右上角 + 上传
    } catch (_) {}
}

// 页面初始化 - 使用多种事件确保加载
document.addEventListener('DOMContentLoaded', initApp);
window.addEventListener('load', function() {
    // 如果DOMContentLoaded时还没加载完，再次尝试
    setTimeout(function() {
        // 再次尝试初始化添加图片按钮
        if (!document.querySelector('#add-image-button')) {
            console.log('添加图片按钮未找到，继续等待...');
        } else {
            initAddImageButton();
            initImageRemoveButtons();
        }
        
        const buttons = document.querySelectorAll('.nav-button-group');
        if (buttons.length > 0) {
            console.log('窗口加载完成，重新绑定按钮事件');
            setupButtonEvents();
        }
        
        // 确保注册按钮已绑定（使用独立函数）
        bindRegisterButton();
        
        // 确保定位按钮已绑定
        const locationIcon = document.querySelector('.location-icon-clickable');
        
        if (locationIcon && !locationIcon.hasAttribute('data-bound')) {
            locationIcon.setAttribute('data-bound', 'true');
            locationIcon.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                updateLocationText('定位中...');
                getCurrentLocation();
            });
        }
    }, 200);
});

// 触摸事件优化
document.addEventListener('touchstart', function(e) {
    // 优化触摸反馈
    if (e.target.classList.contains('nav-btn') || 
        e.target.classList.contains('record-btn')) {
        e.target.style.opacity = '0.7';
    }
}, { passive: true });

document.addEventListener('touchend', function(e) {
    // 恢复触摸反馈
    if (e.target.classList.contains('nav-btn') || 
        e.target.classList.contains('record-btn')) {
        setTimeout(() => {
            e.target.style.opacity = '1';
        }, 100);
    }
}, { passive: true });

// 防止双击缩放
let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// 导出定位相关函数供外部调用
window.locationService = {
    getCurrentLocation: getCurrentLocation,
    updateLocationText: updateLocationText,
    getLocation: function() {
        return currentLocation;
    }
};

// 注册功能
let isRegistered = false;
let userInfo = null;

// 检查是否已注册
// 检查并清理过期的游客数据（超过3天）
function checkAndCleanGuestData() {
    try {
        const guestData = localStorage.getItem('guestData');
        if (guestData) {
            const data = JSON.parse(guestData);
            const guestTime = data.enterTime ? new Date(data.enterTime) : null;
            
            if (guestTime) {
                const now = new Date();
                const daysDiff = (now - guestTime) / (1000 * 60 * 60 * 24); // 天数差
                
                if (daysDiff >= 3) {
                    // 超过3天，清除游客数据
                    localStorage.removeItem('guestData');
                    localStorage.removeItem('realmImages');
                    localStorage.removeItem('realmCurrentImageIndex');
                    
                    // 清除所有选项的图片数组
                    Object.keys(realmImages).forEach(key => {
                        realmImages[key] = [];
                    });
                    Object.keys(realmCurrentImageIndex).forEach(key => {
                        realmCurrentImageIndex[key] = 0;
                    });
                    
                    // 清除主图片显示
                    const img = document.querySelector('.slot-image[data-slot="1"]');
                    const iconContainer = document.getElementById('realm-icon-container');
                    
                    if (img) {
                        img.src = '';
                        img.style.display = 'none';
                    }
                    
                    if (iconContainer) {
                        iconContainer.style.display = 'block';
                    }
                    
                    // 清除所有缩略图
                    const thumbnails = document.querySelectorAll('.thumbnail-image');
                    thumbnails.forEach(thumb => {
                        thumb.src = '';
                        thumb.style.display = 'none';
                    });
                    
                    console.log('✅ 游客数据已超过3天，已清除');
                }
            }
        }
    } catch (error) {
        console.error('检查游客数据失败:', error);
    }
}

function checkRegistrationStatus() {
    try {
        // 先检查并清理过期的游客数据（超过3天会清理游客数据）
        checkAndCleanGuestData();

        // 游客模式优先
        if (isGuestModeActive()) {
            userInfo = null;
            isRegistered = false;
            updateRegisterIconColor(false);
            applyNavButtonsView({ ensureSelectionVisible: true });
            return false;
        }

        // 正常注册状态：从本地读取，不要在刷新时清空（否则图片会“刷新就消失”）
        const savedUserInfo = localStorage.getItem('userInfo');
        if (savedUserInfo) {
            try {
                const parsed = JSON.parse(savedUserInfo);
                if (parsed && typeof parsed === 'object' && parsed.username && Array.isArray(parsed.soulAffiliations)) {
                    userInfo = parsed;
                    isRegistered = true;
                    updateRegisterIconColor(true);
                } else {
                    userInfo = null;
                    isRegistered = false;
                    updateRegisterIconColor(false);
                }
            } catch (_) {
                userInfo = null;
                isRegistered = false;
                updateRegisterIconColor(false);
            }
        } else {
            userInfo = null;
            isRegistered = false;
            updateRegisterIconColor(false);
        }

        // 根据状态显示/布局按钮（不会清理图片数据）
        applyNavButtonsView({ ensureSelectionVisible: true });
        return !!isRegistered;
    } catch (error) {
        console.error('检查注册状态失败:', error);
        try {
            userInfo = null;
            isRegistered = false;
            updateRegisterIconColor(false);
            applyNavButtonsView({ ensureSelectionVisible: true });
        } catch (_) {}
        return false;
    }
}

// 打开注册弹窗
function openRegisterModal() {
    console.log('openRegisterModal 被调用');
    const modal = document.getElementById('register-modal');
    console.log('注册弹窗元素:', modal);
    if (modal) {
        modal.style.display = 'flex';
        console.log('注册弹窗已显示');
        
        // 初始化灵魂归属checkbox限制（最多选择2个）
        initSoulAffiliationCheckboxes();
        
        // 聚焦到用户名输入框
        setTimeout(() => {
            const usernameInput = document.getElementById('register-username');
            if (usernameInput) {
                usernameInput.focus();
            }
        }, 100);
    } else {
        console.error('未找到注册弹窗元素 #register-modal');
    }
}

// 初始化灵魂归属checkbox限制（最多选择2个）
function initSoulAffiliationCheckboxes() {
    const checkboxes = document.querySelectorAll('input[name="soul-affiliation"]');
    const errorDiv = document.getElementById('soul-affiliation-error');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const checkedCount = document.querySelectorAll('input[name="soul-affiliation"]:checked').length;
            
            if (checkedCount > 2) {
                // 如果超过2个，取消当前选择
                this.checked = false;
                if (errorDiv) {
                    errorDiv.style.display = 'block';
                    setTimeout(() => {
                        errorDiv.style.display = 'none';
                    }, 2000);
                }
            } else {
                if (errorDiv) {
                    errorDiv.style.display = 'none';
                }
            }
        });
    });
}

// 显示手机端提示框（Toast）
function showToast(message, duration = 2000) {
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');
    
    if (!toast || !toastMessage) {
        // 如果元素不存在，使用alert作为后备
        alert(message);
        return;
    }
    
    toastMessage.textContent = message;
    toast.style.display = 'flex';
    
    // 添加显示动画
    setTimeout(() => {
        toast.classList.add('toast-show');
    }, 10);
    
    // 自动隐藏
    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => {
            toast.style.display = 'none';
        }, 300);
    }, duration);
}

// 关闭注册弹窗
function closeRegisterModal() {
    const modal = document.getElementById('register-modal');
    if (modal) {
        modal.style.display = 'none';
        // 清空表单
        const form = document.getElementById('register-form');
        if (form) {
            form.reset();
        }
    }
}

// 处理注册表单提交
// 存储临时注册信息（在验证码验证前）
let tempRegisterInfo = null;
let verificationCode = null;
let countdownTimer = null;

// 生成随机游客名称
function generateRandomGuestName() {
    const prefixes = ['游客', '访客', '行者', '过客', '旅人', '游子', '路人'];
    const suffixes = ['001', '002', '003', '004', '005', '006', '007', '008', '009', '010'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return randomPrefix + randomSuffix;
}

// 格式化日期（包含时间，无分隔符）
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}`;
}

// 显示用户信息（注册用户显示用户名，游客显示游客信息）
function displayUserInfo() {
    const guestInfoElement = document.getElementById('guest-info-display');
    if (!guestInfoElement) {
        console.error('未找到用户信息显示元素');
        return;
    }
    
    // 检查是否是注册用户
    const savedUserInfo = localStorage.getItem('userInfo');
    if (savedUserInfo) {
        try {
            const userInfo = JSON.parse(savedUserInfo);
            if (userInfo.username) {
                // 注册用户：显示用户名
                const tspan = guestInfoElement.querySelector('tspan');
                if (tspan) {
                    tspan.textContent = userInfo.username;
                }
                guestInfoElement.setAttribute('visibility', 'visible');
                console.log('✅ 用户名已显示:', userInfo.username);
                return;
            }
        } catch (e) {
            console.error('读取用户信息失败:', e);
        }
    }
    
    // 游客模式：显示游客信息
    let guestData = null;
    try {
        const savedGuestData = localStorage.getItem('guestData');
        if (savedGuestData) {
            guestData = JSON.parse(savedGuestData);
        }
    } catch (e) {
        console.error('读取游客数据失败:', e);
    }
    
    // 如果是游客模式，显示游客信息
    if (guestData && guestData.isGuest) {
        let guestName = guestData.guestName || generateRandomGuestName();
        const enterTime = guestData.enterTime || new Date().toISOString();
        
        // 如果还没有保存游客名称，保存它
        if (!guestData.guestName) {
            guestData.guestName = guestName;
            guestData.enterTime = enterTime;
            try {
                localStorage.setItem('guestData', JSON.stringify(guestData));
            } catch (e) {
                console.error('保存游客数据失败:', e);
            }
        }
        
        // 格式化登录日期
        const loginDate = formatDate(enterTime);
        
        // 显示游客信息：游客名称 + 登录日期
        const guestInfoText = `${guestName} ${loginDate}`;
        const tspan = guestInfoElement.querySelector('tspan');
        if (tspan) {
            tspan.textContent = guestInfoText;
        }
        
        // 显示元素
        guestInfoElement.setAttribute('visibility', 'visible');
        
        console.log('✅ 游客信息已显示:', guestInfoText);
    } else {
        // 既不是注册用户也不是游客，隐藏
        guestInfoElement.setAttribute('visibility', 'hidden');
    }
}

// 显示游客信息（保留原函数名以兼容）
function displayGuestInfo() {
    displayUserInfo();
}

// 游客模式：随便看看
function enterAsGuest() {
    console.log('以游客身份进入');
    
    // 关闭注册弹窗
    closeRegisterModal();
    
    // 保存游客数据（包含进入时间）
    const guestData = {
        enterTime: new Date().toISOString(),
        isGuest: true,
        guestName: generateRandomGuestName() // 生成随机游客名称
    };
    
    try {
        localStorage.setItem('guestData', JSON.stringify(guestData));
        
        // 设置游客模式标志
        isRegistered = false;
        userInfo = null;
        
        // 更新图标颜色（保持未注册状态）
        updateRegisterIconColor(false);
        
        // 游客模式下：锁定"天堂"、"净土"、"祖先"，只解锁"永恒"
        const realms = ['heaven', 'paradise', 'ancestors', 'eternal'];
        realms.forEach(realm => {
            const button = document.querySelector(`.nav-button-group[data-button="${realm}"]`);
            if (button) {
                if (realm === 'eternal') {
                    // "永恒"按钮解锁
                    button.classList.remove('button-locked');
                    button.style.opacity = '1';
                    button.style.cursor = 'pointer';
                    button.style.pointerEvents = 'all';
                    
                    const rect = button.querySelector('.nav-btn-rect');
                    const text = button.querySelector('.nav-btn-text');
                    if (rect) {
                        rect.setAttribute('fill', 'none');
                        rect.setAttribute('stroke', '#fff');
                    }
                    if (text) {
                        text.setAttribute('fill', '#fff');
                    }
                } else {
                    // 其他三个按钮锁定
                    button.classList.add('button-locked');
                    button.style.opacity = '0.5';
                    button.style.cursor = 'not-allowed';
                    button.style.pointerEvents = 'none';
                    
                    const rect = button.querySelector('.nav-btn-rect');
                    const text = button.querySelector('.nav-btn-text');
                    if (rect) {
                        rect.setAttribute('fill', '#666666');
                    }
                    if (text) {
                        text.setAttribute('fill', '#999999');
                    }
                }
            }
        });
        
        // 自动切换到"永恒"按钮
        if (currentSelectedButton !== 'eternal') {
            navigateTo('eternal');
        } else {
            // 如果已经是"永恒"，确保显示正确
            switchRealmImage('eternal');
            loadThoughtTextForRealm('eternal');
        }

        // 游客模式：只显示“永恒”，并布局到主图右下角
        applyNavButtonsView({ ensureSelectionVisible: true });
        
        // 显示游客信息
        displayGuestInfo();
        
        console.log('✅ 已以游客身份进入，3天后图片将自动清除');
    } catch (error) {
        console.error('保存游客数据失败:', error);
    }
}

// 注册第一步：验证邮箱并发送验证码
function handleRegisterStep1(event) {
    event.preventDefault();
    
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    
    // 验证输入
    if (!username) {
        showToast('请输入用户名');
        return;
    }
    
    if (!email) {
        showToast('请输入邮箱地址');
        return;
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('请输入有效的邮箱地址');
        return;
    }
    
    // 获取选择的灵魂归属
    const soulAffiliationCheckboxes = document.querySelectorAll('input[name="soul-affiliation"]:checked');
    const selectedSoulAffiliations = Array.from(soulAffiliationCheckboxes).map(cb => cb.value);
    
    // 验证灵魂归属选择（必须选择2个）
    if (selectedSoulAffiliations.length !== 2) {
        showToast('请勾选2个灵魂归属');
        return;
    }
    
    // 保存临时注册信息
    tempRegisterInfo = {
        username: username,
        email: email,
        soulAffiliations: selectedSoulAffiliations
    };
    
    // 生成6位随机验证码（模拟发送）
    verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('验证码（仅用于测试）:', verificationCode);
    
    // 关闭注册弹窗，打开验证码弹窗
    closeRegisterModal();
    openVerifyCodeModal(email);
}

// 打开验证码输入弹窗
function openVerifyCodeModal(email) {
    const modal = document.getElementById('verify-code-modal');
    const emailDisplay = document.getElementById('verify-email-display');
    const codeInput = document.getElementById('verify-code');
    
    if (!modal) {
        console.error('未找到验证码弹窗元素');
        return;
    }
    
    if (emailDisplay) {
        emailDisplay.textContent = email;
    }
    
    if (codeInput) {
        codeInput.value = '';
        setTimeout(() => {
            codeInput.focus();
        }, 100);
    }
    
    modal.style.display = 'flex';
    
    // 开始倒计时
    startCountdown();
}

// 关闭验证码弹窗
function closeVerifyCodeModal() {
    const modal = document.getElementById('verify-code-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // 清除倒计时
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
    }
    
    const countdownText = document.getElementById('countdown-text');
    if (countdownText) {
        countdownText.textContent = '';
    }
    
    const resendBtn = document.getElementById('resend-code-btn');
    if (resendBtn) {
        resendBtn.disabled = false;
        resendBtn.style.opacity = '1';
    }
}

// 开始倒计时（60秒）
function startCountdown() {
    let countdown = 60;
    const countdownText = document.getElementById('countdown-text');
    const resendBtn = document.getElementById('resend-code-btn');
    
    if (resendBtn) {
        resendBtn.disabled = true;
        resendBtn.style.opacity = '0.5';
    }
    
    if (countdownTimer) {
        clearInterval(countdownTimer);
    }
    
    countdownTimer = setInterval(() => {
        if (countdownText) {
            countdownText.textContent = `${countdown}秒后可重新发送`;
        }
        
        countdown--;
        
        if (countdown < 0) {
            clearInterval(countdownTimer);
            countdownTimer = null;
            if (countdownText) {
                countdownText.textContent = '';
            }
            if (resendBtn) {
                resendBtn.disabled = false;
                resendBtn.style.opacity = '1';
            }
        }
    }, 1000);
}

// 重新发送验证码
function resendVerificationCode() {
    if (!tempRegisterInfo) {
        return;
    }
    
    // 重新生成验证码
    verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('新验证码（仅用于测试）:', verificationCode);
    
    showToast('验证码已重新发送');
    
    // 重新开始倒计时
    startCountdown();
}

// 注册第二步：验证验证码并完成注册
function handleRegisterStep2(event) {
    event.preventDefault();
    
    const codeInput = document.getElementById('verify-code');
    const enteredCode = codeInput ? codeInput.value.trim() : '';
    
    if (!enteredCode) {
        showToast('请输入验证码');
        return;
    }
    
    if (enteredCode.length !== 6) {
        showToast('验证码为6位数字');
        return;
    }
    
    // 验证验证码
    if (enteredCode !== verificationCode) {
        showToast('验证码错误，请重新输入');
        codeInput.value = '';
        setTimeout(() => {
            codeInput.focus();
        }, 100);
        return;
    }
    
    // 验证码正确，完成注册
    if (!tempRegisterInfo) {
        showToast('注册信息已过期，请重新注册');
        closeVerifyCodeModal();
        openRegisterModal();
        return;
    }
    
    // 保存用户信息（包括灵魂归属）
    userInfo = {
        username: tempRegisterInfo.username,
        email: tempRegisterInfo.email,
        soulAffiliations: tempRegisterInfo.soulAffiliations,
        registerTime: new Date().toISOString()
    };
    
    try {
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        isRegistered = true;

        // 注册成功：退出游客模式（否则会一直只显示“永恒”）
        try { localStorage.removeItem('guestData'); } catch (_) {}
        
        // 更新图标颜色为黄色
        updateRegisterIconColor(true);
        
        // 注册成功：仅显示用户选择的2个按钮，并布局到主图右下角
        applyNavButtonsView({ ensureSelectionVisible: true });
        
        // 关闭验证码弹窗
        closeVerifyCodeModal();
        
        // 显示用户名
        displayUserInfo();
        
        // 清除临时信息
        tempRegisterInfo = null;
        verificationCode = null;
        
        console.log('用户注册成功:', userInfo);
    } catch (error) {
        console.error('保存用户信息失败:', error);
        showToast('注册失败，请重试');
    }
}

// 更新注册图标颜色
function updateRegisterIconColor(registered) {
    const registerIcon = document.querySelector('.register-icon');
    if (registerIcon) {
        if (registered) {
            // 注册后变为黄色
            registerIcon.style.fill = '#ffd72e';
            registerIcon.classList.add('registered');
            console.log('注册图标已变为黄色');
        } else {
            // 未注册状态为白色
            registerIcon.style.fill = '#fff';
            registerIcon.classList.remove('registered');
        }
    }
}

// 导出按钮相关函数供调试
window.buttonService = {
    navigateTo: navigateTo,
    selectButton: selectButton,
    clearButtonSelection: clearButtonSelection,
    testButtons: function() {
        console.log('测试按钮功能...');
        const buttons = document.querySelectorAll('.nav-button-group');
        console.log('找到按钮:', buttons.length);
        buttons.forEach((btn, index) => {
            const name = btn.getAttribute('data-button');
            console.log(`按钮 ${index + 1}: ${name}`, btn);
        });
        
        // 测试选中功能
        console.log('测试选中天堂按钮...');
        selectButton('heaven');
        
        setTimeout(() => {
            console.log('测试选中净土按钮...');
            selectButton('paradise');
        }, 1000);
    }
};

// 导出注册相关函数到全局作用域，供HTML中的onclick和onsubmit调用
window.handleRegisterStep1 = handleRegisterStep1;
window.handleRegisterStep2 = handleRegisterStep2;
window.closeVerifyCodeModal = closeVerifyCodeModal;
window.resendVerificationCode = resendVerificationCode;
window.openRegisterModal = openRegisterModal;
window.closeRegisterModal = closeRegisterModal;
window.handleRegisterButtonClick = handleRegisterButtonClick; // 导出点击处理函数供测试

// 导出注册相关函数到服务对象
window.registerService = {
    openRegisterModal: openRegisterModal,
    closeRegisterModal: closeRegisterModal,
    checkRegistrationStatus: checkRegistrationStatus,
    getUserInfo: function() {
        return userInfo;
    },
    // 测试函数：手动触发注册弹窗
    testOpenModal: function() {
        console.log('测试：手动打开注册弹窗');
        openRegisterModal();
    },
    // 测试函数：检查注册按钮是否已绑定
    testRegisterButton: function() {
        const btn = document.querySelector('.register-button') || document.querySelector('#组_4');
        const icon = document.querySelector('.register-icon') || document.querySelector('#路径_2');
        console.log('注册按钮元素:', btn);
        console.log('注册图标元素:', icon);
        console.log('按钮是否已绑定:', btn ? btn.hasAttribute('data-bound') : '按钮不存在');
        console.log('手动测试点击...');
        if (btn) {
            handleRegisterButtonClick({ preventDefault: () => {}, stopPropagation: () => {}, target: btn });
        }
        return { button: btn, icon: icon };
    },
    // 测试函数：手动触发注册按钮点击
    testClick: function() {
        console.log('手动触发注册按钮点击...');
        handleRegisterButtonClick({ preventDefault: () => {}, stopPropagation: () => {}, target: null });
    }
};

// 全局点击事件监听器（作为最后的保障）- 增强版
document.addEventListener('click', function(e) {
    const target = e.target;
    let shouldHandle = false;
    
    if (target) {
        // 检查class
        if (target.classList && (
            target.classList.contains('register-button') ||
            target.classList.contains('register-icon')
        )) {
            shouldHandle = true;
        }
        // 检查ID
        else if (target.id === '组_4' || target.id === '路径_2') {
            shouldHandle = true;
        }
        // 检查父元素
        else if (target.closest) {
            const closestButton = target.closest('.register-button') || target.closest('#组_4');
            if (closestButton) {
                shouldHandle = true;
            }
        }
        // 手动向上查找
        else {
            let parent = target.parentElement;
            let depth = 0;
            while (parent && depth < 10) {
                if (parent.classList && parent.classList.contains('register-button')) {
                    shouldHandle = true;
                    break;
                }
                if (parent.id === '组_4') {
                    shouldHandle = true;
                    break;
                }
                parent = parent.parentElement;
                depth++;
            }
        }
    }
    
    if (shouldHandle) {
        console.log('🎯🎯🎯 全局监听器捕获到注册按钮点击！', target);
        e.preventDefault();
        e.stopPropagation();
        handleRegisterButtonClick(e);
    }
}, true); // 使用捕获阶段，确保优先处理

// 页面加载完成后，多次尝试绑定注册按钮（确保成功）
let bindAttempts = 0;
const maxBindAttempts = 20; // 增加到20次
const bindInterval = setInterval(function() {
    bindAttempts++;
    console.log(`🔄 尝试绑定注册按钮 (第${bindAttempts}次)...`);
    
    if (bindRegisterButton()) {
        console.log('✅✅✅ 注册按钮绑定成功！');
        clearInterval(bindInterval);
    } else if (bindAttempts >= maxBindAttempts) {
        console.error('❌ 注册按钮绑定失败，已达到最大尝试次数，但全局监听器仍会工作');
        clearInterval(bindInterval);
    }
}, 300); // 缩短间隔到300ms

// 15秒后停止尝试
setTimeout(function() {
    clearInterval(bindInterval);
    // 最后一次尝试
    console.log('⏰ 最后尝试绑定注册按钮...');
    bindRegisterButton();
}, 15000);

// SVG覆盖层功能已移除

// 初始化图片删除按钮功能
function initImageRemoveButtons() {
    // 为所有删除按钮绑定事件
    const removeButtons = document.querySelectorAll('.image-remove-btn');
    console.log('🔍 找到', removeButtons.length, '个删除按钮');
    
    removeButtons.forEach(btn => {
        // 如果已经绑定过，跳过
        if (btn.dataset.bound === 'true') {
            return;
        }
        
        btn.dataset.bound = 'true';
        const slotNumber = parseInt(btn.dataset.slot);
        
        btn.addEventListener('click', function(e) {
            // 只阻止事件冒泡，不影响图片的双击事件
            e.stopPropagation();
            console.log('🗑️ 删除位置', slotNumber, '的图片');
            removeImageFromSlot(slotNumber);
        });
        
        // 也添加触摸事件支持
        btn.addEventListener('touchend', function(e) {
            // 只阻止事件冒泡，不影响图片的双击事件
            e.stopPropagation();
            console.log('🗑️ 触摸删除位置', slotNumber, '的图片');
            removeImageFromSlot(slotNumber);
        }, { passive: false });
    });
    
    console.log('✅ 图片删除按钮已初始化，共', removeButtons.length, '个按钮');
}

// 更新小图框显示
function updateThumbnails(realm) {
    const images = realmImages[realm] || [];
    const currentIndex = realmCurrentImageIndex[realm] || 0;
    
    // 更新所有7个小图框
    for (let i = 1; i <= 7; i++) {
        const thumbnailImg = document.querySelector(`.thumbnail-image[data-thumbnail="${i}"]`);
        const thumbnailContainer = document.querySelector(`.thumbnail-container[data-thumbnail="${i}"]`);
        
        if (!thumbnailImg || !thumbnailContainer) continue;
        
        const imageIndex = i - 1; // 转换为0-based索引
        
        if (imageIndex < images.length && images[imageIndex]) {
            // 有图片，显示图片
            thumbnailImg.src = images[imageIndex];
            thumbnailImg.style.display = 'block';
            
            // 如果是当前显示的图片，添加高亮边框
            if (imageIndex === currentIndex) {
                thumbnailContainer.style.border = '2px solid #007AFF';
            } else {
                thumbnailContainer.style.border = 'none';
            }
        } else {
            // 没有图片，隐藏
            thumbnailImg.src = '';
            thumbnailImg.style.display = 'none';
            thumbnailContainer.style.border = 'none';
        }
    }
}

// 初始化小图框交互
function initThumbnails() {
    // 点击小图切换大图
    const thumbnailImages = document.querySelectorAll('.thumbnail-image');
    thumbnailImages.forEach((img, index) => {
        const thumbnailIndex = parseInt(img.dataset.thumbnail) - 1; // 转换为0-based索引
        
        // 移除旧的事件监听器
        const newImg = img.cloneNode(true);
        img.parentNode.replaceChild(newImg, img);
        
        // 添加点击事件
        newImg.addEventListener('click', function(e) {
            e.stopPropagation();
            if (currentSelectedButton && Array.isArray(realmImages[currentSelectedButton])) {
                const images = realmImages[currentSelectedButton];
                if (thumbnailIndex < images.length && images[thumbnailIndex]) {
                    console.log('🖼️ 切换到第', thumbnailIndex + 1, '张图片');
                    realmCurrentImageIndex[currentSelectedButton] = thumbnailIndex;
                    saveRealmImages();
                    switchRealmImage(currentSelectedButton);
                }
            }
        });
        
        // 添加触摸事件
        newImg.addEventListener('touchend', function(e) {
            e.stopPropagation();
            if (currentSelectedButton && Array.isArray(realmImages[currentSelectedButton])) {
                const images = realmImages[currentSelectedButton];
                if (thumbnailIndex < images.length && images[thumbnailIndex]) {
                    console.log('🖼️ 触摸切换到第', thumbnailIndex + 1, '张图片');
                    realmCurrentImageIndex[currentSelectedButton] = thumbnailIndex;
                    saveRealmImages();
                    switchRealmImage(currentSelectedButton);
                }
            }
        }, { passive: false });
    });
    
    console.log('✅ 小图框交互已初始化');
}

// 从指定位置删除图片（删除当前选中选项的当前图片）
function removeImageFromSlot(slotNumber) {
    const img = document.querySelector(`.slot-image[data-slot="${slotNumber}"]`);
    const container = document.querySelector(`.image-container[data-slot="${slotNumber}"]`);
    const removeBtn = document.querySelector(`.image-remove-btn[data-slot="${slotNumber}"]`);
    
    if (!img || !container) {
        console.error('❌ 找不到位置', slotNumber, '的图片或容器');
        return;
    }
    
    // 删除当前选中选项的当前图片
    if (currentSelectedButton && Array.isArray(realmImages[currentSelectedButton])) {
        const images = realmImages[currentSelectedButton];
        const currentIndex = realmCurrentImageIndex[currentSelectedButton] || 0;
        
        if (images.length > 0 && images[currentIndex]) {
            console.log('🗑️ 删除选项', currentSelectedButton, '的第', currentIndex + 1, '张图片');
            images.splice(currentIndex, 1);
            
            // 同步删除对应的文字和生卒年
            if (Array.isArray(realmThoughtTexts[currentSelectedButton])) {
                realmThoughtTexts[currentSelectedButton].splice(currentIndex, 1);
            }
            if (Array.isArray(realmBirthDeath[currentSelectedButton])) {
                realmBirthDeath[currentSelectedButton].splice(currentIndex, 1);
            }
            if (Array.isArray(realmTextColors[currentSelectedButton])) {
                realmTextColors[currentSelectedButton].splice(currentIndex, 1);
                saveRealmTextColors();
            }
            clearImageTransform(currentSelectedButton, currentIndex);
            saveRealmThoughtTexts();
            
            // 调整当前索引
            if (images.length === 0) {
                realmCurrentImageIndex[currentSelectedButton] = 0;
            } else if (currentIndex >= images.length) {
                realmCurrentImageIndex[currentSelectedButton] = images.length - 1;
            }
            
            saveRealmImages();
            
            // 更新显示
            switchRealmImage(currentSelectedButton);
        }
    }
    
    // 隐藏图片
    img.style.display = 'none';
    img.src = '';
    img.onload = null;
    img.onerror = null;
    
    // 清除图片数据
    img.style.transform = '';
    img.style.left = '';
    img.style.top = '';
    img.style.width = '';
    img.style.height = '';
    img.classList.remove('zoomed');
    
    // 克隆节点以移除所有事件监听器，然后替换原节点
    // 这样可以确保重新添加图片时不会有重复的事件监听器
    const newImg = img.cloneNode(true);
    img.parentNode.replaceChild(newImg, img);
    
    // 隐藏删除按钮并重置颜色为默认白色
    if (removeBtn) {
        removeBtn.style.display = 'none';
        removeBtn.style.visibility = 'hidden';
        removeBtn.style.opacity = '0';
        removeBtn.dataset.bound = 'false'; // 允许重新绑定
        // 重置按钮颜色为默认白色，下次添加图片时会根据新图片亮度重新设置
        removeBtn.style.setProperty('border-color', '#ffffff', 'important');
        removeBtn.style.setProperty('color', '#ffffff', 'important');
    }
    
    // 显示领域图标（当图片被删除后）
    if (currentSelectedButton) {
        const iconContainer = document.getElementById('realm-icon-container');
        if (iconContainer) {
            iconContainer.style.display = 'block';
        }
        updateRealmIcon(currentSelectedButton);
    }
    
    console.log('✅ 选项', currentSelectedButton, '的图片已删除，现在显示空白框和图标');
}

// SVG覆盖层拖动功能已移除

// 思念文字功能
function initThoughtText() {
    const thoughtText = document.getElementById('你思·故我在');
    if (!thoughtText) {
        console.error('未找到"你思·故我在"文字元素');
        return;
    }
    
    // 添加点击事件
    thoughtText.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('点击了"你思·故我在"文字');
        openMottoModal();
    });
    
    // 也支持触摸事件
    thoughtText.addEventListener('touchend', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('触摸了"你思·故我在"文字');
        openMottoModal();
    }, { passive: false });
    
    // 为显示在主图片上的思念文字添加点击事件
    const thoughtDisplayText = document.getElementById('thought-display-text');
    if (thoughtDisplayText) {
        thoughtDisplayText.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('点击了思念文字显示区域');
            openThoughtModal({ mode: 'main' });
        });
        
        thoughtDisplayText.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('触摸了思念文字显示区域');
            openThoughtModal({ mode: 'main' });
        }, { passive: false });
    }
    
    // 为显示在主图片上的生卒年文字添加点击事件
    const birthDeathDisplayText = document.getElementById('birth-death-display-text');
    if (birthDeathDisplayText) {
        birthDeathDisplayText.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('点击了生卒年显示区域');
            openThoughtModal({ mode: 'main' });
        });
        
        birthDeathDisplayText.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('触摸了生卒年显示区域');
            openThoughtModal({ mode: 'main' });
        }, { passive: false });
    }
    
    // 加载已保存的思念文字
    loadThoughtText();
    // 加载已保存的寄语标题文字
    loadMottoText();
    // 加载放大页底部说明文字
    loadFullscreenNoteText();

    // 放大页底部说明文字点击编辑
    const fullscreenNoteText = document.getElementById('fullscreen-note-text');
    if (fullscreenNoteText) {
        const openNoteEditor = (e) => {
            e.preventDefault();
            e.stopPropagation();
            openMottoModal({ target: 'fullscreen-note' });
        };
        fullscreenNoteText.addEventListener('click', openNoteEditor);
        fullscreenNoteText.addEventListener('touchend', openNoteEditor, { passive: false });
    }
    
    console.log('✅ 思念文字功能已初始化（包括显示文字和生卒年的点击功能）');
}

// “你思·故我在”标题文字（寄语）编辑
const MOTTO_STORAGE_KEY = 'mottoTitleText';
const MOTTO_DEFAULT_TEXT = '你思·故我在';
const FULLSCREEN_NOTE_STORAGE_KEY = 'fullscreenNoteText';
const FULLSCREEN_NOTE_DEFAULT_TEXT = '云归不提供安慰.也不制造意义，它只承认一件事-生命来过.因果成立。';
let mottoEditTarget = 'motto';

function getMottoTextFromDom() {
    const el = document.getElementById('你思·故我在');
    if (!el) return MOTTO_DEFAULT_TEXT;
    const tspan = el.querySelector('tspan');
    const raw = (tspan ? tspan.textContent : el.textContent) || '';
    const t = raw.trim();
    return t || MOTTO_DEFAULT_TEXT;
}

function applyMottoTextToDom(text) {
    const el = document.getElementById('你思·故我在');
    if (!el) return;
    const safe = (text || '').toString().trim() || MOTTO_DEFAULT_TEXT;
    const tspan = el.querySelector('tspan');
    if (tspan) tspan.textContent = safe;
    else el.textContent = safe;
}

function getFullscreenNoteTextFromDom() {
    const el = document.getElementById('fullscreen-note-text');
    const raw = el ? el.textContent : '';
    const t = (raw || '').trim();
    return t || FULLSCREEN_NOTE_DEFAULT_TEXT;
}

function applyFullscreenNoteTextToDom(text) {
    const el = document.getElementById('fullscreen-note-text');
    if (!el) return;
    const safe = (text || '').toString().trim() || FULLSCREEN_NOTE_DEFAULT_TEXT;
    el.textContent = safe;
}

function openMottoModal(options = {}) {
    const modal = document.getElementById('motto-modal');
    const input = document.getElementById('motto-input');
    if (!modal || !input) return;
    mottoEditTarget = options.target === 'fullscreen-note' ? 'fullscreen-note' : 'motto';
    if (mottoEditTarget === 'fullscreen-note') {
        input.value = getFullscreenNoteTextFromDom();
    } else {
        input.value = getMottoTextFromDom();
    }
    // 放大页打开时，确保弹窗在最上层
    try {
        if (!modal.dataset.prevZ) modal.dataset.prevZ = modal.style.zIndex || '';
        if (document.body.classList.contains('fullscreen-open')) {
            modal.style.zIndex = '10020';
        } else if (modal.dataset.prevZ != null) {
            modal.style.zIndex = modal.dataset.prevZ;
        }
    } catch (_) {}
    modal.style.display = 'flex';
    setTimeout(() => input.focus(), 0);
}

function closeMottoModal() {
    const modal = document.getElementById('motto-modal');
    if (!modal) return;
    modal.style.display = 'none';
    try {
        if (modal.dataset.prevZ != null) {
            modal.style.zIndex = modal.dataset.prevZ;
        }
    } catch (_) {}
}

function saveMotto() {
    const input = document.getElementById('motto-input');
    if (!input) return;
    const text = (input.value || '').trim();
    if (mottoEditTarget === 'fullscreen-note') {
        const finalText = text || FULLSCREEN_NOTE_DEFAULT_TEXT;
        applyFullscreenNoteTextToDom(finalText);
        try {
            localStorage.setItem(FULLSCREEN_NOTE_STORAGE_KEY, finalText);
        } catch (_) {}
    } else {
        const finalText = text || MOTTO_DEFAULT_TEXT;
        applyMottoTextToDom(finalText);
        try {
            localStorage.setItem(MOTTO_STORAGE_KEY, finalText);
        } catch (_) {}
    }
    closeMottoModal();
}

function loadMottoText() {
    try {
        const saved = localStorage.getItem(MOTTO_STORAGE_KEY);
        if (saved && saved.trim()) {
            applyMottoTextToDom(saved.trim());
        } else {
            applyMottoTextToDom(getMottoTextFromDom());
        }
    } catch (_) {
        applyMottoTextToDom(getMottoTextFromDom());
    }
}

function loadFullscreenNoteText() {
    try {
        const saved = localStorage.getItem(FULLSCREEN_NOTE_STORAGE_KEY);
        if (saved && saved.trim()) {
            applyFullscreenNoteTextToDom(saved.trim());
        } else {
            applyFullscreenNoteTextToDom(getFullscreenNoteTextFromDom());
        }
    } catch (_) {
        applyFullscreenNoteTextToDom(getFullscreenNoteTextFromDom());
    }
}

// 思念弹窗编辑上下文：
// - main：保存到 localStorage，并更新主页面
// - fullscreen：只保存到放大页草稿，不影响主页面
let thoughtEditContext = { mode: 'main', realm: null, index: null };
let thoughtModalPrevZIndex = '';

// 打开思念文字输入对话框
function openThoughtModal(options = {}) {
    const modal = document.getElementById('thought-modal');
    const input = document.getElementById('thought-input');
    const birthDeathInput = document.getElementById('birth-death-input');
    const panel = document.getElementById('thought-color-panel');
    const sv = document.getElementById('thought-color-sv');
    const cursor = document.getElementById('thought-color-cursor');
    const hue = document.getElementById('thought-color-hue');
    const hex = document.getElementById('thought-color-hex');
    const presets = document.getElementById('thought-color-presets');
    
    if (!modal || !input) {
        console.error('未找到思念对话框元素');
        return;
    }
    
    const mode = options.mode === 'fullscreen' ? 'fullscreen' : 'main';
    const currentRealm = options.realm || currentSelectedButton || 'heaven';
    const currentIndex = Number.isFinite(options.index) ? options.index : (realmCurrentImageIndex[currentRealm] || 0);
    thoughtEditContext = { mode, realm: currentRealm, index: currentIndex };
    
    // 全屏态下弹窗必须盖在全屏之上
    if (mode === 'fullscreen') {
        thoughtModalPrevZIndex = modal.style.zIndex || '';
        modal.style.zIndex = '10050';
    } else {
        modal.style.zIndex = thoughtModalPrevZIndex || '';
    }
    
    // 确保数组存在
    if (!Array.isArray(realmThoughtTexts[currentRealm])) {
        realmThoughtTexts[currentRealm] = [];
    }
    if (!Array.isArray(realmBirthDeath[currentRealm])) {
        realmBirthDeath[currentRealm] = [];
    }
    
    const draftKey = getFullscreenDraftKey(currentRealm, currentIndex);
    const draft = fullscreenTextDrafts[draftKey] || {};
    
    // 加载内容：
    // - fullscreen：优先草稿，其次 realm 已保存内容
    // - main：使用 realm 已保存内容
    const savedThought = mode === 'fullscreen'
        ? ((draft.thought ?? realmThoughtTexts[currentRealm][currentIndex] ?? '') || '')
        : (realmThoughtTexts[currentRealm][currentIndex] || '');

    if (savedThought) {
        input.value = savedThought;
    } else {
        // 设置默认值为"永远怀念"
        input.value = '永远怀念';
    }
    
    // 加载当前图片索引已保存的生卒年信息（如果有），否则使用默认值
    if (birthDeathInput) {
        const savedBirthDeath = mode === 'fullscreen'
            ? ((draft.birthDeath ?? realmBirthDeath[currentRealm][currentIndex] ?? '') || '')
            : (realmBirthDeath[currentRealm][currentIndex] || '');
        if (savedBirthDeath) {
            birthDeathInput.value = savedBirthDeath;
        } else {
            // 设置默认值为"1949-2049"
            birthDeathInput.value = '1949-2049';
        }
    }

    // 颜色：默认自动；如有自定义色则切到自定义
    const savedCustomColor = (() => {
        if (mode === 'fullscreen') {
            const c = normalizeHexColor(draft.textColor || '');
            if (c) return c;
        }
        return getCustomTextColor(currentRealm, currentIndex);
    })();

    // --- 色谱选色（对话框内） ---
    const clamp01 = (n) => Math.max(0, Math.min(1, n));
    const hsvToRgb = (h, s, v) => {
        const c = v * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = v - c;
        let r = 0, g = 0, b = 0;
        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    };
    const rgbToHsv = (r, g, b) => {
        const rn = r / 255, gn = g / 255, bn = b / 255;
        const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
        const d = max - min;
        let h = 0;
        if (d !== 0) {
            if (max === rn) h = 60 * (((gn - bn) / d) % 6);
            else if (max === gn) h = 60 * (((bn - rn) / d) + 2);
            else h = 60 * (((rn - gn) / d) + 4);
        }
        if (h < 0) h += 360;
        const s = max === 0 ? 0 : d / max;
        const v = max;
        return { h, s, v };
    };
    const hexToRgb = (hexStr) => {
        const m = (hexStr || '').match(/^#?([0-9a-fA-F]{6})$/);
        if (!m) return null;
        const v = m[1];
        return {
            r: parseInt(v.slice(0, 2), 16),
            g: parseInt(v.slice(2, 4), 16),
            b: parseInt(v.slice(4, 6), 16)
        };
    };
    const rgbToHex = (r, g, b) => {
        const to2 = (n) => n.toString(16).padStart(2, '0');
        return `#${to2(r)}${to2(g)}${to2(b)}`.toLowerCase();
    };

    let hsvState = { h: 0, s: 0, v: 1 }; // 默认白色

    const updateSvBackground = () => {
        if (!sv) return;
        const base = `hsl(${Math.round(hsvState.h)} 100% 50%)`;
        sv.style.background = `linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0)), linear-gradient(to right, #ffffff, ${base})`;
    };
    const updateCursor = () => {
        if (!sv || !cursor) return;
        const rect = sv.getBoundingClientRect();
        cursor.style.left = `${hsvState.s * rect.width}px`;
        cursor.style.top = `${(1 - hsvState.v) * rect.height}px`;
    };
    const updateHexAndSwatch = () => {
        const { r, g, b } = hsvToRgb(hsvState.h, hsvState.s, hsvState.v);
        const c = rgbToHex(r, g, b);
        if (hex) hex.value = c;
    };
    const setFromHex = (hexStr) => {
        const rgb = hexToRgb(hexStr);
        if (!rgb) return;
        hsvState = rgbToHsv(rgb.r, rgb.g, rgb.b);
        if (hue) hue.value = String(Math.round(hsvState.h));
        updateSvBackground();
        updateHexAndSwatch();
        // cursor 需要等布局稳定
        setTimeout(updateCursor, 0);
    };

    if (panel && sv && cursor && hue && hex) {
        // 记录用户是否真的“动过颜色”（未动颜色时保存不应覆盖原有自动/自定义色）
        panel.dataset.colorTouched = '0';
        const markColorTouched = () => { panel.dataset.colorTouched = '1'; };

        // 不再显示“自动颜色/色框”，色谱始终在弹窗内展示
        // 初始颜色：有自定义色就用自定义；否则用当前页面自动色（避免上来就固定白色）
        const autoFillFromDom = (() => {
            try {
                if (mode === 'fullscreen') {
                    const el = document.getElementById('fullscreen-thought-text');
                    const c = el ? (el.style.color || '') : '';
                    return normalizeHexColor(c) || '';
                }
                const el = document.getElementById('thought-display-text');
                return normalizeHexColor(el?.getAttribute('fill')) || '';
            } catch (_) { return ''; }
        })();

        setFromHex(savedCustomColor || autoFillFromDom || '#ffffff');

        if (!hue.hasAttribute('data-bound')) {
            hue.setAttribute('data-bound', 'true');
            hue.addEventListener('input', () => {
                markColorTouched();
                hsvState.h = parseFloat(hue.value) || 0;
                updateSvBackground();
                updateHexAndSwatch();
                updateCursor();
            });
        }

        if (!sv.hasAttribute('data-bound')) {
            sv.setAttribute('data-bound', 'true');
            const pickAt = (clientX, clientY) => {
                const rect = sv.getBoundingClientRect();
                const x = clamp01((clientX - rect.left) / rect.width);
                const y = clamp01((clientY - rect.top) / rect.height);
                hsvState.s = x;
                hsvState.v = 1 - y;
                updateHexAndSwatch();
                updateCursor();
            };
            const onPointerDown = (e) => {
                e.preventDefault();
                sv.setPointerCapture?.(e.pointerId);
                markColorTouched();
                pickAt(e.clientX, e.clientY);
            };
            const onPointerMove = (e) => {
                if (e.buttons === 0 && e.pointerType === 'mouse') return;
                markColorTouched();
                pickAt(e.clientX, e.clientY);
            };
            sv.addEventListener('pointerdown', onPointerDown);
            sv.addEventListener('pointermove', onPointerMove);
        }

        if (!hex.hasAttribute('data-bound')) {
            hex.setAttribute('data-bound', 'true');
            hex.addEventListener('input', () => {
                const v = hex.value.trim();
                if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                    markColorTouched();
                    setFromHex(v);
                }
            });
        }

        if (presets && !presets.hasAttribute('data-bound')) {
            presets.setAttribute('data-bound', 'true');
            // 给每个按钮写入真实颜色
            presets.querySelectorAll('.thought-color-preset').forEach((btn) => {
                const c = normalizeHexColor(btn.getAttribute('data-color'));
                if (c) btn.style.background = c;
            });
            presets.addEventListener('click', (e) => {
                const t = e.target;
                if (!(t instanceof Element)) return;
                const btn = t.closest('.thought-color-preset');
                if (!btn) return;
                const c = normalizeHexColor(btn.getAttribute('data-color'));
                if (c) {
                    markColorTouched();
                    setFromHex(c);
                }
            });
        }
    }
    
    // 确保输入框可编辑
    input.readOnly = false;
    input.disabled = false;
    if (birthDeathInput) {
        birthDeathInput.readOnly = false;
        birthDeathInput.disabled = false;
    }
    
    // 添加字符数限制监听（只绑定一次，避免重复绑定导致多次触发）
    if (!input.hasAttribute('data-bound')) {
        input.setAttribute('data-bound', 'true');
        input.addEventListener('input', function() {
            const currentLength = this.value.length;
            if (currentLength > 20) {
                this.value = this.value.substring(0, 20);
                alert('最多只能输入20个字！');
            }
        });
    }
    
    modal.style.display = 'flex';
    // 聚焦到输入框
    setTimeout(() => {
        input.focus();
    }, 100);
}

// 关闭思念文字输入对话框
function closeThoughtModal() {
    const modal = document.getElementById('thought-modal');
    if (modal) {
        modal.style.display = 'none';
        // 恢复 z-index（避免后续主页面弹窗层级异常）
        if (thoughtEditContext.mode === 'fullscreen') {
            modal.style.zIndex = thoughtModalPrevZIndex || '';
        }
    }
}

// 保存思念文字
function saveThought() {
    const input = document.getElementById('thought-input');
    const birthDeathInput = document.getElementById('birth-death-input');
    const panel = document.getElementById('thought-color-panel');
    const hex = document.getElementById('thought-color-hex');
    
    if (!input) {
        console.error('未找到输入框');
        return;
    }
    
    const currentRealm = thoughtEditContext.realm || (currentSelectedButton || 'heaven');
    const currentIndex = Number.isFinite(thoughtEditContext.index) ? thoughtEditContext.index : (realmCurrentImageIndex[currentRealm] || 0);
    
    // 确保数组存在
    if (!Array.isArray(realmThoughtTexts[currentRealm])) {
        realmThoughtTexts[currentRealm] = [];
    }
    if (!Array.isArray(realmBirthDeath[currentRealm])) {
        realmBirthDeath[currentRealm] = [];
    }
    
    const thoughtText = input.value.trim();
    const birthDeathText = birthDeathInput ? birthDeathInput.value.trim() : '';

    // 只有用户真的动过色谱/色相/HEX，才覆盖保存的颜色；否则保持原来的自动/自定义色不变
    const colorTouched = !!(panel && panel.dataset && panel.dataset.colorTouched === '1');
    const pickedColor = hex ? normalizeHexColor(hex.value) : '';
    const finalCustomColor = colorTouched ? (pickedColor || '') : null;

    // fullscreen：只写入草稿，不影响主页面与 localStorage
    if (thoughtEditContext.mode === 'fullscreen') {
        const key = getFullscreenDraftKey(currentRealm, currentIndex);
        fullscreenTextDrafts[key] = fullscreenTextDrafts[key] || {};
        fullscreenTextDrafts[key].thought = thoughtText || '';
        fullscreenTextDrafts[key].birthDeath = birthDeathText || '';
        if (finalCustomColor !== null) {
            fullscreenTextDrafts[key].textColor = finalCustomColor || '';
        }

        const fullscreenThoughtEl = document.getElementById('fullscreen-thought-text');
        const fullscreenBirthDeathEl = document.getElementById('fullscreen-birth-death');
        if (fullscreenThoughtEl) {
            fullscreenThoughtEl.textContent = thoughtText || '';
            fullscreenThoughtEl.style.display = 'block';
            fullscreenThoughtEl.style.visibility = 'visible';
        }
        if (fullscreenBirthDeathEl) {
            fullscreenBirthDeathEl.textContent = birthDeathText || '';
            fullscreenBirthDeathEl.style.display = 'block';
            fullscreenBirthDeathEl.style.visibility = 'visible';
        }

        // 颜色：只有触碰过颜色才应用新颜色；否则保持放大页原来的颜色
        if (finalCustomColor !== null) {
            const mainThoughtEl = document.getElementById('thought-display-text');
            const autoFill = normalizeHexColor(mainThoughtEl?.getAttribute('fill')) || '#ffffff';
            const colorToApply = finalCustomColor || autoFill;
            if (fullscreenThoughtEl) fullscreenThoughtEl.style.color = colorToApply;
            if (fullscreenBirthDeathEl) fullscreenBirthDeathEl.style.color = colorToApply;
        }

        layoutFullscreenTextOverlays();
        try { adjustFullscreenOverlayIconColors(); } catch (_) {}
        try { adjustFullscreenNoteTextColor(); } catch (_) {}
        closeThoughtModal();
        return;
    }

    // main：保存到 realm + localStorage，并更新主页面显示
    if (thoughtText) {
        realmThoughtTexts[currentRealm][currentIndex] = thoughtText;
        realmBirthDeath[currentRealm][currentIndex] = birthDeathText || '';
        saveRealmThoughtTexts();

        if (finalCustomColor !== null) {
            if (!Array.isArray(realmTextColors[currentRealm])) realmTextColors[currentRealm] = [];
            realmTextColors[currentRealm][currentIndex] = finalCustomColor || '';
            saveRealmTextColors();
        }

        displayThoughtText(thoughtText, birthDeathText);
        closeThoughtModal();
    } else {
        realmThoughtTexts[currentRealm][currentIndex] = '';
        realmBirthDeath[currentRealm][currentIndex] = '';
        saveRealmThoughtTexts();
        if (!Array.isArray(realmTextColors[currentRealm])) realmTextColors[currentRealm] = [];
        realmTextColors[currentRealm][currentIndex] = '';
        saveRealmTextColors();
        clearThoughtText();
        closeThoughtModal();
    }
}

// 在主画面显示思念文字（图片上方）
function displayThoughtText(text, birthDeath) {
    const displayElement = document.getElementById('thought-display-text');
    const birthDeathElement = document.getElementById('birth-death-display-text');
    
    if (!displayElement) {
        console.error('未找到思念文字显示元素');
        return;
    }
    
    const tspan = displayElement.querySelector('tspan');
    if (tspan) {
        tspan.textContent = text;
        // SVG text元素需要使用visibility属性
        displayElement.setAttribute('visibility', 'visible');
        displayElement.setAttribute('opacity', '1');
        // 确保点击功能可用（更新style属性，确保pointer-events和cursor正确）
        let currentStyle = displayElement.getAttribute('style') || '';
        currentStyle = currentStyle.replace(/pointer-events:\s*none/gi, 'pointer-events: all');
        if (!currentStyle.includes('cursor: pointer')) {
            currentStyle = currentStyle.trim();
            if (currentStyle && !currentStyle.endsWith(';')) {
                currentStyle += ';';
            }
            currentStyle += ' cursor: pointer;';
        }
        displayElement.setAttribute('style', currentStyle);
        
        // 检测图片亮度并调整文字颜色（会设置正确的颜色和样式）
        // adjustThoughtTextColor 函数内部会同步设置生卒年颜色
        adjustThoughtTextColor();
        
        // 确保点击功能在颜色调整后仍然可用（防止被覆盖）
        // 延迟一点确保adjustThoughtTextColor已完成
        setTimeout(() => {
            let finalStyle = displayElement.getAttribute('style') || '';
            finalStyle = finalStyle.replace(/pointer-events:\s*[^;]+/gi, 'pointer-events: all');
            if (!finalStyle.includes('cursor: pointer')) {
                finalStyle = finalStyle.trim();
                if (finalStyle && !finalStyle.endsWith(';')) {
                    finalStyle += ';';
                }
                finalStyle += ' cursor: pointer;';
            }
            displayElement.setAttribute('style', finalStyle);
            console.log('✅ 思念文字点击功能已确保启用');
        }, 100);
        
        console.log('✅ 思念文字已显示在主画面:', text);
    } else {
        console.error('未找到tspan元素');
    }
    
    // 显示生卒年信息
    if (birthDeathElement && birthDeath) {
        const birthDeathTspan = birthDeathElement.querySelector('tspan');
        if (birthDeathTspan) {
            birthDeathTspan.textContent = birthDeath;
            birthDeathElement.setAttribute('visibility', 'visible');
            birthDeathElement.setAttribute('opacity', '1');
            // 确保点击功能可用（更新style属性，确保pointer-events和cursor正确）
            let currentStyle = birthDeathElement.getAttribute('style') || '';
            currentStyle = currentStyle.replace(/pointer-events:\s*none/gi, 'pointer-events: all');
            if (!currentStyle.includes('cursor: pointer')) {
                currentStyle = currentStyle.trim();
                if (currentStyle && !currentStyle.endsWith(';')) {
                    currentStyle += ';';
                }
                currentStyle += ' cursor: pointer;';
            }
            birthDeathElement.setAttribute('style', currentStyle);
            // 生卒年颜色会在 adjustThoughtTextColor 中同步设置，确保与思念文字一致
            // 立即同步一次颜色，确保显示时颜色正确
            const thoughtElement = document.getElementById('thought-display-text');
            if (thoughtElement) {
                const thoughtFill = thoughtElement.getAttribute('fill');
                if (thoughtFill) {
                    birthDeathElement.setAttribute('fill', thoughtFill);
                    // 同时更新style属性
                    const currentStyle = birthDeathElement.getAttribute('style') || '';
                    let newStyle = currentStyle.replace(/fill:\s*#[0-9a-fA-F]{6}/gi, '').replace(/fill:\s*#[0-9a-fA-F]{3}/gi, '').replace(/fill:\s*[^;]+/gi, '').trim();
                    if (newStyle && !newStyle.endsWith(';')) {
                        newStyle += ';';
                    }
                    birthDeathElement.setAttribute('style', (newStyle ? newStyle + ' ' : '') + 'fill: ' + thoughtFill + ';');
                }
            }
            // 延迟一点再次确保颜色同步（adjustThoughtTextColor 会再次设置）
            setTimeout(() => {
                const thoughtElement2 = document.getElementById('thought-display-text');
                if (thoughtElement2) {
                    const finalThoughtFill = thoughtElement2.getAttribute('fill');
                    if (finalThoughtFill) {
                        birthDeathElement.setAttribute('fill', finalThoughtFill);
                        const currentStyle = birthDeathElement.getAttribute('style') || '';
                        let newStyle = currentStyle.replace(/fill:\s*#[0-9a-fA-F]{6}/gi, '').replace(/fill:\s*#[0-9a-fA-F]{3}/gi, '').replace(/fill:\s*[^;]+/gi, '').trim();
                        if (newStyle && !newStyle.endsWith(';')) {
                            newStyle += ';';
                        }
                        birthDeathElement.setAttribute('style', (newStyle ? newStyle + ' ' : '') + 'fill: ' + finalThoughtFill + ';');
                    }
                }
            }, 150);
            console.log('✅ 生卒年已显示在主画面:', birthDeath);
        }
    } else if (birthDeathElement) {
        // 如果没有生卒年，隐藏
        birthDeathElement.setAttribute('visibility', 'hidden');
        birthDeathElement.setAttribute('opacity', '0');
    }
}

// 根据图片背景亮度调整思念文字颜色
function adjustThoughtTextColor() {
    const img = document.querySelector('.slot-image[data-slot="1"]');
    const displayElement = document.getElementById('thought-display-text');
    
    if (!img || !displayElement) {
        console.log('未找到图片或文字元素，使用默认白色');
        displayElement.setAttribute('fill', '#ffffff');
        return;
    }

    // ✅ 自定义色优先：如果用户为当前 realm/当前图片选择了颜色，则不再走亮度自动黑白
    try {
        const realm = currentSelectedButton || 'heaven';
        const idx = realmCurrentImageIndex[realm] || 0;
        const custom = getCustomTextColor(realm, idx);
        if (custom) {
            setSvgTextFillPreserveStyle(displayElement, custom, true);
            const birthDeathElement = document.getElementById('birth-death-display-text');
            if (birthDeathElement) setSvgTextFillPreserveStyle(birthDeathElement, custom, true);
            return;
        }
    } catch (_) {}
    
    // 如果图片未显示，使用默认白色
    if (img.style.display === 'none' || !img.src) {
        displayElement.setAttribute('fill', '#ffffff');
        return;
    }
    
    // 创建 canvas 来分析图片亮度
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 设置 canvas 尺寸
    const sampleSize = 100;
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    
    // 等待图片加载完成
    if (!img.complete || img.naturalWidth === 0) {
        setTimeout(() => adjustThoughtTextColor(), 100);
        return;
    }
    
    try {
        // 计算文字位置在图片中的相对位置
        // 文字位置：x=196.5, y=632
        // 图片位置：x=0, y=159
        // 文字在图片中的相对位置：x相对=196.5-0=196.5, y相对=632-159=473
        // 图片尺寸：393 x 573.113
        // 采样区域：文字位置周围更大的区域，以获得更准确的背景亮度
        const imgX = 196.5; // 文字在图片中的x位置
        const imgY = 473; // 文字在图片中的y位置（向上移动3px）
        
        // 扩大采样区域，检测文字周围更大范围的背景
        const sampleRadius = 150; // 增大采样半径
        
        // 绘制图片到canvas（绘制文字位置周围更大区域）
        const sourceX = Math.max(0, (imgX / 393) * img.naturalWidth - sampleRadius / 2);
        const sourceY = Math.max(0, (imgY / 573.113) * img.naturalHeight - sampleRadius / 2);
        const sourceWidth = Math.min(sampleRadius, img.naturalWidth - sourceX);
        const sourceHeight = Math.min(sampleRadius, img.naturalHeight - sourceY);
        
        // 调整canvas尺寸以匹配采样区域
        canvas.width = sourceWidth;
        canvas.height = sourceHeight;
        
        ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
        
        // 获取图片数据
        const imageData = ctx.getImageData(0, 0, sourceWidth, sourceHeight);
        const data = imageData.data;
        
        // 计算平均亮度
        let totalBrightness = 0;
        let pixelCount = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            if (a > 0) {
                // 使用标准亮度公式：Y = 0.299*R + 0.587*G + 0.114*B
                const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
                totalBrightness += brightness;
                pixelCount++;
            }
        }
        
        if (pixelCount === 0) {
            console.log('无法计算亮度，使用默认白色');
            displayElement.setAttribute('fill', '#ffffff');
            return;
        }
        
        const averageBrightness = totalBrightness / pixelCount;
        console.log('图片平均亮度:', averageBrightness.toFixed(2));
        
        // 提高阈值到150，更准确地区分浅色和深色背景
        // 如果平均亮度大于150，认为是浅色背景，文字用黑色
        // 否则用白色（深色背景）
        let textColor;
        // 先获取当前的style，保留pointer-events和cursor设置
        // 对于思念文字显示元素，始终保留点击功能
        const isThoughtDisplay = displayElement.id === 'thought-display-text';
        
        if (averageBrightness > 150) {
            textColor = '#000000';
            displayElement.setAttribute('fill', '#000000');
            // 思念文字显示元素始终保留pointer-events和cursor设置
            let newStyle = 'text-anchor: middle; font-size: 38.4px; font-weight: bold; font-family: FZLanTingHeiS-DB-GB, Microsoft YaHei, SimHei, sans-serif; fill: #000000; opacity: 1;';
            if (isThoughtDisplay) {
                newStyle = 'pointer-events: all; cursor: pointer; ' + newStyle;
            }
            displayElement.setAttribute('style', newStyle);
            console.log('✅ 检测到浅色背景（亮度', averageBrightness.toFixed(2), '），文字已切换为黑色', isThoughtDisplay ? '（已保留点击功能）' : '');
        } else {
            textColor = '#ffffff';
            displayElement.setAttribute('fill', '#ffffff');
            // 思念文字显示元素始终保留pointer-events和cursor设置
            let newStyle = 'text-anchor: middle; font-size: 38.4px; font-weight: bold; font-family: FZLanTingHeiS-DB-GB, Microsoft YaHei, SimHei, sans-serif; fill: #ffffff; opacity: 1;';
            if (isThoughtDisplay) {
                newStyle = 'pointer-events: all; cursor: pointer; ' + newStyle;
            }
            displayElement.setAttribute('style', newStyle);
            console.log('✅ 检测到深色背景（亮度', averageBrightness.toFixed(2), '），文字保持白色', isThoughtDisplay ? '（已保留点击功能）' : '');
        }
        
        // 同步设置生卒年颜色，确保完全一致（无论是否可见，都设置颜色）
        const birthDeathElement = document.getElementById('birth-death-display-text');
        if (birthDeathElement) {
            birthDeathElement.setAttribute('fill', textColor);
            // 同时更新style属性，确保颜色生效，但保留pointer-events和cursor设置
            const currentStyle = birthDeathElement.getAttribute('style') || '';
            const hasPointerEvents = currentStyle.includes('pointer-events: all');
            const hasCursor = currentStyle.includes('cursor: pointer');
            // 移除旧的fill设置
            let newStyle = currentStyle.replace(/fill:\s*#[0-9a-fA-F]{6}/gi, '').replace(/fill:\s*#[0-9a-fA-F]{3}/gi, '').replace(/fill:\s*[^;]+/gi, '').trim();
            // 添加新的fill设置
            if (newStyle && !newStyle.endsWith(';')) {
                newStyle += ';';
            }
            newStyle += ' fill: ' + textColor + ';';
            // 确保保留pointer-events和cursor
            if (hasPointerEvents || birthDeathElement.id === 'birth-death-display-text') {
                newStyle = newStyle.replace(/pointer-events:\s*[^;]+/gi, '');
                newStyle = 'pointer-events: all; cursor: pointer; ' + newStyle;
            }
            birthDeathElement.setAttribute('style', newStyle);
            console.log('✅ 生卒年颜色已同步为:', textColor);
        }
    } catch (error) {
        console.error('❌ 亮度检测失败:', error);
        // 出错时保持默认白色
        displayElement.setAttribute('fill', '#ffffff');
    }
}

// 清除思念文字显示
function clearThoughtText() {
    const displayElement = document.getElementById('thought-display-text');
    const birthDeathElement = document.getElementById('birth-death-display-text');
    
    if (displayElement) {
        displayElement.setAttribute('visibility', 'hidden');
        displayElement.setAttribute('opacity', '0');
        const tspan = displayElement.querySelector('tspan');
        if (tspan) {
            tspan.textContent = '';
        }
    }
    
    if (birthDeathElement) {
        birthDeathElement.setAttribute('visibility', 'hidden');
        birthDeathElement.setAttribute('opacity', '0');
        const tspan = birthDeathElement.querySelector('tspan');
        if (tspan) {
            tspan.textContent = '';
        }
    }
}

// 根据图片背景亮度调整生卒年文字颜色（使用与思念文字完全相同的逻辑）
function adjustBirthDeathTextColor() {
    const img = document.querySelector('.slot-image[data-slot="1"]');
    const displayElement = document.getElementById('birth-death-display-text');
    const thoughtElement = document.getElementById('thought-display-text');
    
    if (!img || !displayElement) {
        return;
    }
    
    if (img.style.display === 'none' || !img.src) {
        displayElement.setAttribute('fill', '#ffffff');
        return;
    }
    
    // 直接使用思念文字的颜色，确保完全一致
    if (thoughtElement) {
        const thoughtFill = thoughtElement.getAttribute('fill');
        if (thoughtFill) {
            displayElement.setAttribute('fill', thoughtFill);
            return;
        }
    }
    
    // 如果无法获取思念文字颜色，使用相同的检测逻辑
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const sampleSize = 100;
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    
    if (!img.complete || img.naturalWidth === 0) {
        setTimeout(() => adjustBirthDeathTextColor(), 100);
        return;
    }
    
    try {
        // 使用与思念文字相同的检测位置和逻辑
        const imgX = 196.5;
        const imgY = 503;
        const sampleRadius = 150;
        const sourceX = Math.max(0, (imgX / 393) * img.naturalWidth - sampleRadius / 2);
        const sourceY = Math.max(0, (imgY / 573.113) * img.naturalHeight - sampleRadius / 2);
        const sourceWidth = Math.min(sampleRadius, img.naturalWidth - sourceX);
        const sourceHeight = Math.min(sampleRadius, img.naturalHeight - sourceY);
        
        canvas.width = sourceWidth;
        canvas.height = sourceHeight;
        ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
        
        const imageData = ctx.getImageData(0, 0, sourceWidth, sourceHeight);
        const data = imageData.data;
        
        let totalBrightness = 0;
        let pixelCount = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            if (a > 0) {
                const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
                totalBrightness += brightness;
                pixelCount++;
            }
        }
        
        if (pixelCount === 0) {
            displayElement.setAttribute('fill', '#ffffff');
            return;
        }
        
        const averageBrightness = totalBrightness / pixelCount;
        
        // 使用与思念文字完全相同的阈值（150）
        if (averageBrightness > 150) {
            displayElement.setAttribute('fill', '#000000');
        } else {
            displayElement.setAttribute('fill', '#ffffff');
        }
    } catch (error) {
        displayElement.setAttribute('fill', '#ffffff');
    }
}

// 从localStorage加载已保存的思念文字（用于初始化）
function loadThoughtText() {
    // 获取当前选中的realm，如果没有则使用默认值
    const currentRealm = currentSelectedButton || 'heaven';
    loadThoughtTextForRealm(currentRealm);
}

// 加载指定realm的当前图片索引的思念文字和生卒年
function loadThoughtTextForRealm(realm) {
    const currentIndex = realmCurrentImageIndex[realm] || 0;
    
    // 确保数组存在
    if (!Array.isArray(realmThoughtTexts[realm])) {
        realmThoughtTexts[realm] = [];
    }
    if (!Array.isArray(realmBirthDeath[realm])) {
        realmBirthDeath[realm] = [];
    }
    
    const savedThought = realmThoughtTexts[realm][currentIndex] || '';
    const savedBirthDeath = realmBirthDeath[realm][currentIndex] || '';
    
    console.log('📖 加载realm', realm, '图片索引', currentIndex, '的思念文字:', savedThought || '(默认)', '生卒年:', savedBirthDeath || '(默认)');
    
    if (savedThought) {
        displayThoughtText(savedThought, savedBirthDeath);
    } else {
        // 如果没有保存的内容，显示默认值
        displayThoughtText('永远怀念', '1949-2049');
    }
}

// 全屏功能
let isFullscreen = false;

// 放大页文字（仅放大页生效，不回写主页面）
const fullscreenTextDrafts = Object.create(null);

// 放大页轮播（7张缩略图对应的图片，在放大页大图自动轮播）
const FULLSCREEN_CAROUSEL_INTERVAL_MS = 3 * 60 * 1000; // 3分钟
let fullscreenCarouselTimer = null;
let fullscreenCarouselRealm = null;
let fullscreenCarouselIndex = 0;
let fullscreenCarouselLocked = false;

function getActiveFullscreenRealm() {
    return fullscreenCarouselRealm || currentSelectedButton || 'heaven';
}

function getActiveFullscreenIndex() {
    return Number.isFinite(fullscreenCarouselIndex) ? fullscreenCarouselIndex : (realmCurrentImageIndex[getActiveFullscreenRealm()] || 0);
}

function stopFullscreenCarousel() {
    if (fullscreenCarouselTimer) {
        clearInterval(fullscreenCarouselTimer);
        fullscreenCarouselTimer = null;
    }
}

function findNextAvailableImageIndex(realm, fromIndex) {
    const images = realmImages[realm] || [];
    // 轮播只针对“七张缩略图区域”可展示的图片
    const n = Math.min(images.length, 7);
    if (n <= 1) return fromIndex;
    const start = Number.isFinite(fromIndex) ? fromIndex : 0;
    for (let step = 1; step <= n; step++) {
        const idx = (start + step) % n;
        if (images[idx]) return idx;
    }
    return start;
}

function renderFullscreenFrameForIndex(realm, idx) {
    const images = realmImages[realm] || [];
    const fullscreenImage = document.getElementById('fullscreen-image');
    if (!fullscreenImage) return;
    if (!images[idx]) return;

    // 更新大图
    fullscreenImage.src = images[idx];
    fullscreenImage.style.display = 'block';
    applyFullscreenImageTransform(realm, idx);

    // 更新放大页文字（草稿优先，其次主页面已保存）
    const fullscreenThoughtText = document.getElementById('fullscreen-thought-text');
    const fullscreenBirthDeath = document.getElementById('fullscreen-birth-death');
    const draftKey = getFullscreenDraftKey(realm, idx);
    const draft = fullscreenTextDrafts[draftKey] || {};

    const savedThought = (realmThoughtTexts[realm] && realmThoughtTexts[realm][idx]) ? realmThoughtTexts[realm][idx] : '永远怀念';
    const savedBirthDeath = (realmBirthDeath[realm] && realmBirthDeath[realm][idx]) ? realmBirthDeath[realm][idx] : '1949-2049';

    if (fullscreenThoughtText) {
        fullscreenThoughtText.textContent = (draft.thought ?? savedThought ?? '').toString();
        fullscreenThoughtText.style.display = 'block';
        fullscreenThoughtText.style.visibility = 'visible';
    }
    if (fullscreenBirthDeath) {
        fullscreenBirthDeath.textContent = (draft.birthDeath ?? savedBirthDeath ?? '').toString();
        fullscreenBirthDeath.style.display = 'block';
        fullscreenBirthDeath.style.visibility = 'visible';
    }

    // 文字颜色：草稿自定义色优先；否则跟随主页面当前颜色
    try {
        const mainThoughtEl = document.getElementById('thought-display-text');
        const autoFill = normalizeHexColor(mainThoughtEl?.getAttribute('fill')) || '#ffffff';
        const draftColor = normalizeHexColor(draft.textColor || '');
        const colorToApply = draftColor || autoFill;
        if (fullscreenThoughtText) fullscreenThoughtText.style.color = colorToApply;
        if (fullscreenBirthDeath) fullscreenBirthDeath.style.color = colorToApply;
    } catch (_) {}

    // 更新右下角统计数字（按当前图）
    try { renderEngagementCounts(realm, idx); } catch (_) {}

    // 重新排版（等图片加载完成后由 onload 触发一次；这里也轻量触发）
    try { layoutFullscreenTextOverlays(); } catch (_) {}
}

function updateCarouselLockUi() {
    const btn = document.getElementById('fullscreen-carousel-lock');
    if (!btn) return;
    btn.dataset.locked = fullscreenCarouselLocked ? '1' : '0';
    btn.setAttribute('aria-label', fullscreenCarouselLocked ? '开锁继续轮播' : '锁定暂停轮播');
}

function setFullscreenCarouselLocked(locked) {
    fullscreenCarouselLocked = !!locked;
    updateCarouselLockUi();
    if (fullscreenCarouselLocked) stopFullscreenCarousel();
    else startFullscreenCarousel();
}

function startFullscreenCarousel() {
    stopFullscreenCarousel();
    if (!isFullscreen) return;
    if (document.body.classList.contains('share-view')) return; // 演示模式不轮播/不交互
    if (fullscreenCarouselLocked) return;

    const realm = getActiveFullscreenRealm();
    const images = realmImages[realm] || [];
    const availableCount = images.slice(0, 7).filter(Boolean).length;
    if (availableCount <= 1) return;

    fullscreenCarouselTimer = setInterval(() => {
        if (!isFullscreen || fullscreenCarouselLocked) return;
        const r = getActiveFullscreenRealm();
        const curIdx = getActiveFullscreenIndex();
        const nextIdx = findNextAvailableImageIndex(r, curIdx);
        if (nextIdx === getActiveFullscreenIndex()) return;
        fullscreenCarouselIndex = nextIdx;
        renderFullscreenFrameForIndex(r, nextIdx);

        // 轮播切到新图：刷新转发统计显示
        if (!document.body.classList.contains('share-view')) {
            renderEngagementCounts(r, nextIdx);
        }
    }, FULLSCREEN_CAROUSEL_INTERVAL_MS);
}

function getFullscreenDraftKey(realm, index) {
    return `${realm || 'heaven'}::${typeof index === 'number' ? index : 0}`;
}

// 放大页“转发”计数（按 realm + 图片索引分别统计）
const fullscreenEngagementStats = (() => {
    try {
        const raw = localStorage.getItem('fullscreenEngagementStats');
        const parsed = raw ? JSON.parse(raw) : null;
        return parsed && typeof parsed === 'object' ? parsed : Object.create(null);
    } catch (_) {
        return Object.create(null);
    }
})();

function getEngagementKey(realm, index) {
    return `${realm || 'heaven'}::${typeof index === 'number' ? index : 0}`;
}

function ensureEngagement(realm, index) {
    const key = getEngagementKey(realm, index);
    const cur = fullscreenEngagementStats[key];
    if (!cur || typeof cur !== 'object') {
        fullscreenEngagementStats[key] = { seen: 0, forward: 0 };
    } else {
        if (!Number.isFinite(cur.seen)) cur.seen = 0;
        if (!Number.isFinite(cur.forward)) cur.forward = 0;
    }
    return fullscreenEngagementStats[key];
}

function saveEngagementStats() {
    try {
        localStorage.setItem('fullscreenEngagementStats', JSON.stringify(fullscreenEngagementStats));
    } catch (_) {}
}

function renderEngagementCounts(realm, index) {
    const forwardEl = document.getElementById('fullscreen-forward-count');
    if (!forwardEl) return;
    const stats = ensureEngagement(realm, index);
    forwardEl.textContent = String(stats.forward || 0);
}

function layoutFullscreenTextOverlays() {
    const img = document.getElementById('fullscreen-image');
    const thoughtEl = document.getElementById('fullscreen-thought-text');
    const bdEl = document.getElementById('fullscreen-birth-death');
    if (!img || !thoughtEl || !bdEl) return;

    const imgH = img.offsetHeight || img.clientHeight;
    const imgW = img.offsetWidth || img.clientWidth;
    if (!imgH || !imgW) return;

    // 字体按图片缩放（相对原始图片框宽度 393）
    const scale = imgW / 393;
    thoughtEl.style.fontSize = `${38.4 * scale}px`;
    bdEl.style.fontSize = `${20.4 * scale}px`;

    // 基于主页面 SVG 基线位置（SVG 中 y 为基线，需换算为 HTML top）
    // 主页面文字基线：thought y=657, birth y=687（图片框起点 y=159）
    const thoughtBaselineRatio = (657 - 159) / 573.113; // 498 / 573.113
    const birthBaselineRatio = (687 - 159) / 573.113;  // 528 / 573.113

    requestAnimationFrame(() => {
        const thoughtFontSize = parseFloat(getComputedStyle(thoughtEl).fontSize) || (38.4 * scale);
        const birthFontSize = parseFloat(getComputedStyle(bdEl).fontSize) || (20.4 * scale);

        const thoughtBaseline = imgH * thoughtBaselineRatio;
        const birthBaseline = imgH * birthBaselineRatio;

        const thoughtTop = Math.max(0, thoughtBaseline - thoughtFontSize);
        const birthTop = Math.max(0, birthBaseline - birthFontSize);

        thoughtEl.style.top = `${thoughtTop}px`;
        bdEl.style.top = `${birthTop}px`;

        // 放大页“花圈区域文字”自动黑/白（有自定义色则不覆盖）
        // 延迟到布局完成后取样，避免不同 WebView 下出现“文字看不见”
        requestAnimationFrame(() => {
            try { adjustFullscreenThoughtTextColor(); } catch (_) {}
        });
    });
}

// 放大页思念/生卒年：根据图片背景亮度自动黑/白（尊重自定义色）
function adjustFullscreenThoughtTextColor() {
    const img = document.getElementById('fullscreen-image');
    const thoughtEl = document.getElementById('fullscreen-thought-text');
    const bdEl = document.getElementById('fullscreen-birth-death');
    if (!img || !thoughtEl || !bdEl) return;
    if (!isFullscreen) return;

    const realm = (typeof getActiveFullscreenRealm === 'function' ? getActiveFullscreenRealm() : (currentSelectedButton || 'heaven')) || 'heaven';
    const idx = (typeof getActiveFullscreenIndex === 'function' ? getActiveFullscreenIndex() : (realmCurrentImageIndex[realm] || 0)) || 0;

    // 自定义色优先：草稿色 > 主页面已保存自定义色
    try {
        const draftKey = getFullscreenDraftKey(realm, idx);
        const draft = fullscreenTextDrafts[draftKey] || {};
        const draftColor = normalizeHexColor(draft.textColor || '');
        const savedCustom = getCustomTextColor(realm, idx);
        const custom = draftColor || savedCustom;
        if (custom) {
            thoughtEl.style.color = custom;
            bdEl.style.color = custom;
            return;
        }
    } catch (_) {}

    // 没图片时默认白色
    if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) return;

    try {
        const clamp01 = (n) => Math.max(0, Math.min(1, n));
        const tRect = thoughtEl.getBoundingClientRect();
        const iRect = img.getBoundingClientRect();
        const cx = tRect.left + tRect.width * 0.5;
        const cy = tRect.top + tRect.height * 0.5;
        const rx = (cx - iRect.left) / (iRect.width || 1);
        const ry = (cy - iRect.top) / (iRect.height || 1);
        const sx = clamp01(rx) * img.naturalWidth;
        const sy = clamp01(ry) * img.naturalHeight;

        const sampleW = Math.max(40, Math.min(240, img.naturalWidth * 0.22));
        const sampleH = Math.max(26, Math.min(180, img.naturalHeight * 0.16));
        const sourceX = Math.max(0, Math.min(img.naturalWidth - sampleW, sx - sampleW / 2));
        const sourceY = Math.max(0, Math.min(img.naturalHeight - sampleH, sy - sampleH / 2));

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 90;
        canvas.height = 70;
        ctx.drawImage(img, sourceX, sourceY, sampleW, sampleH, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let total = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3];
            if (a <= 0) continue;
            const r = data[i], g = data[i + 1], b = data[i + 2];
            total += 0.299 * r + 0.587 * g + 0.114 * b;
            count++;
        }
        if (!count) return;
        const avg = total / count;
        const c = avg > 150 ? '#000000' : '#ffffff';
        thoughtEl.style.color = c;
        bdEl.style.color = c;
    } catch (_) {
        // 出错不处理（保留当前颜色）
    }
}

// 放大页按钮：根据图片亮度自动黑/白（关闭按钮 + 轮播锁）
function adjustFullscreenOverlayIconColors() {
    const img = document.getElementById('fullscreen-image');
    const closeIcon = document.getElementById('fullscreen-close-icon-in-image');
    const lockBtn = document.getElementById('fullscreen-carousel-lock');
    if (!img || (!closeIcon && !lockBtn)) return;
    if (!isFullscreen) return;
    if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) return;

    try {
        const avgFallback = (() => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const sampleSize = 100;
                canvas.width = sampleSize;
                canvas.height = sampleSize;
                ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
                const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
                const data = imageData.data;
                let total = 0;
                let count = 0;
                for (let i = 0; i < data.length; i += 4) {
                    const a = data[i + 3];
                    if (a <= 0) continue;
                    const r = data[i], g = data[i + 1], b = data[i + 2];
                    total += 0.299 * r + 0.587 * g + 0.114 * b;
                    count++;
                }
                if (!count) return null;
                return total / count;
            } catch (_) {
                return null;
            }
        })();

        const applyColor = (el, avg) => {
            const base = (avg == null ? 128 : avg);
            const iconColor = base > 128 ? '#000000' : '#ffffff';
            el.style.color = iconColor;
            if (el === lockBtn) {
                el.style.borderColor = iconColor;
            } else {
                const paths = el.querySelectorAll('.fullscreen-icon-fill');
                paths.forEach((p) => { p.style.fill = iconColor; });
            }
        };

        if (closeIcon) {
            const near = sampleImageBrightnessNearElement(img, closeIcon);
            applyColor(closeIcon, near == null ? avgFallback : near);
        }
        if (lockBtn) {
            const near = sampleImageBrightnessNearElement(img, lockBtn);
            applyColor(lockBtn, near == null ? avgFallback : near);
        }
    } catch (_) {
        // 出错时保持当前颜色
    }
}

// 初始化全屏功能
function initFullscreen() {
    const fullscreenIcon = document.getElementById('fullscreen-icon-btn') || document.getElementById('fullscreen-icon');
    if (!fullscreenIcon) {
        console.warn('⚠️ 未找到全屏图标');
        return;
    }
    
    // 移除旧的事件监听器
    const newIcon = fullscreenIcon.cloneNode(true);
    fullscreenIcon.parentNode.replaceChild(newIcon, fullscreenIcon);
    
    // 添加点击事件
    newIcon.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        // 第一页：只允许“点图标放大”，不做 toggle，避免状态异常导致误触变成缩小
        enterFullscreen();
    });
    
    // 添加触摸事件
    newIcon.addEventListener('touchend', function(e) {
        e.preventDefault();
        e.stopPropagation();
        enterFullscreen();
    }, { passive: false });
    
    // 初始化关闭按钮
    initFullscreenCloseBtn();
    
    console.log('✅ 全屏功能已初始化');
}

// 切换全屏
function toggleFullscreen() {
    if (isFullscreen) {
        exitFullscreen();
    } else {
        enterFullscreen();
    }
}

// 进入全屏
function enterFullscreen() {
    if (!currentSelectedButton) {
        console.warn('⚠️ 没有选中的选项，无法进入全屏');
        return;
    }
    
    const images = realmImages[currentSelectedButton] || [];
    const currentIndex = realmCurrentImageIndex[currentSelectedButton] || 0;
    
    if (images.length === 0 || !images[currentIndex]) {
        console.warn('⚠️ 当前没有图片，无法进入全屏');
        return;
    }
    
    const fullscreenModal = document.getElementById('fullscreen-modal');
    const fullscreenImage = document.getElementById('fullscreen-image');
    const fullscreenContent = document.getElementById('fullscreen-content');
    const fullscreenThoughtText = document.getElementById('fullscreen-thought-text');
    const fullscreenBirthDeath = document.getElementById('fullscreen-birth-death');
    const fullscreenCloseIcon = document.getElementById('fullscreen-close-icon-in-image');
    const candleVideo = document.getElementById('fullscreen-candle-video');
    const candleVideo5 = document.getElementById('fullscreen-candle-video-5');
    const forwardBtn = document.getElementById('fullscreen-forward-icon');
    
    if (!fullscreenModal || !fullscreenImage || !fullscreenContent) {
        console.error('❌ 未找到全屏模态元素');
        return;
    }
    
    // 设置图片源
    fullscreenImage.src = images[currentIndex];
    fullscreenImage.style.display = 'block';

    // 初始化轮播状态（放大页独立，不回写主页面索引）
    fullscreenCarouselRealm = currentSelectedButton;
    fullscreenCarouselIndex = currentIndex;
    
    // 获取当前显示的思念文字和生卒年
    const currentThought = realmThoughtTexts[currentSelectedButton] && realmThoughtTexts[currentSelectedButton][currentIndex] 
        ? realmThoughtTexts[currentSelectedButton][currentIndex] 
        : '永远怀念';
    const currentBirthDeath = realmBirthDeath[currentSelectedButton] && realmBirthDeath[currentSelectedButton][currentIndex]
        ? realmBirthDeath[currentSelectedButton][currentIndex]
        : '1949-2049';
    
    // 放大页显示独立文字（点击弹窗编辑，不回写主页面）
    const draftKey = getFullscreenDraftKey(currentSelectedButton, currentIndex);
    const draft = fullscreenTextDrafts[draftKey] || {};

    if (fullscreenThoughtText) {
        fullscreenThoughtText.style.display = 'block';
        fullscreenThoughtText.style.visibility = 'visible';
        fullscreenThoughtText.textContent = (draft.thought ?? currentThought ?? '').toString();
    }
    if (fullscreenBirthDeath) {
        fullscreenBirthDeath.style.display = 'block';
        fullscreenBirthDeath.style.visibility = 'visible';
        fullscreenBirthDeath.textContent = (draft.birthDeath ?? currentBirthDeath ?? '').toString();
    }

    // 放大页文字点击 → 同一个弹窗编辑（保存仅写入放大页草稿）
    const bindOpen = (el) => {
        if (!el || el.hasAttribute('data-open-bound')) return;
        el.setAttribute('data-open-bound', 'true');
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            openThoughtModal({ mode: 'fullscreen', realm: getActiveFullscreenRealm(), index: getActiveFullscreenIndex() });
        };
        el.addEventListener('click', handler);
        el.addEventListener('touchend', handler, { passive: false });
    };
    bindOpen(fullscreenThoughtText);
    bindOpen(fullscreenBirthDeath);

    // 放大页文字颜色默认跟随主页面当前颜色（但编辑/显示互不影响；如草稿选了自定义色则优先）
    const mainThoughtEl = document.getElementById('thought-display-text');
    const mainBirthDeathEl = document.getElementById('birth-death-display-text');
    try {
        const draftColor = normalizeHexColor(draft.textColor || '');
        if (draftColor) {
            if (fullscreenThoughtText) fullscreenThoughtText.style.color = draftColor;
            if (fullscreenBirthDeath) fullscreenBirthDeath.style.color = draftColor;
        } else {
            const thoughtColor = mainThoughtEl?.getAttribute('fill') || (mainThoughtEl ? window.getComputedStyle(mainThoughtEl).fill : '');
            const bdColor = mainBirthDeathEl?.getAttribute('fill') || (mainBirthDeathEl ? window.getComputedStyle(mainBirthDeathEl).fill : '');
            if (fullscreenThoughtText && thoughtColor) fullscreenThoughtText.style.color = thoughtColor;
            if (fullscreenBirthDeath && bdColor) fullscreenBirthDeath.style.color = bdColor;
        }
    } catch (_) {}
    
    // 显示全屏模态
    fullscreenModal.style.display = 'flex';
    isFullscreen = true;

    // 进入放大页：刷新转发统计显示
    if (!document.body.classList.contains('share-view')) {
        renderEngagementCounts(currentSelectedButton, currentIndex);
    }

    // 轮播锁按钮（只绑定一次）
    const lockBtn = document.getElementById('fullscreen-carousel-lock');
    if (lockBtn && !lockBtn.hasAttribute('data-bound')) {
        lockBtn.setAttribute('data-bound', 'true');
        const toggle = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setFullscreenCarouselLocked(!fullscreenCarouselLocked);
        };
        lockBtn.addEventListener('click', toggle);
        lockBtn.addEventListener('touchend', toggle, { passive: false });
    }
    // 显示/隐藏锁：只有当当前 realm 有两张及以上图片时显示
    if (lockBtn) {
        const availableCount = (images || []).filter(Boolean).length;
        lockBtn.style.display = (availableCount > 1 && !document.body.classList.contains('share-view')) ? 'flex' : 'none';
        if (!lockBtn.dataset.locked) lockBtn.dataset.locked = '0';
        updateCarouselLockUi();
    }
    
    // 防止页面滚动
    document.body.style.overflow = 'hidden';
    document.documentElement.classList.add('fullscreen-open');
    document.body.classList.add('fullscreen-open');
    
    
    // 放大页图片尺寸由第一页主图比例决定（满宽、固定图片框比例）
    
    // 计算缩放比例，使图片宽度与页面一致，高度顺延
    fullscreenImage.onload = function() {
        adjustFullscreenContentSize();
        layoutFullscreenTextOverlays();
        applyFullscreenImageTransform(currentSelectedButton, currentIndex);
    };
    
    // 如果图片已加载，立即调整尺寸
    if (fullscreenImage.complete) {
        adjustFullscreenContentSize();
        layoutFullscreenTextOverlays();
        applyFullscreenImageTransform(currentSelectedButton, currentIndex);
    }

    // 蜡烛视频：仅放大页显示并自动播放（不影响第一页）
    if (candleVideo) {
        candleVideo.style.display = 'block';
        candleVideo.currentTime = 0;
        const p = candleVideo.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
    }

    // 蜡烛5：仅放大页右侧显示并自动播放
    if (candleVideo5) {
        candleVideo5.style.display = 'block';
        candleVideo5.currentTime = 0;
        const p5 = candleVideo5.play();
        if (p5 && typeof p5.catch === 'function') p5.catch(() => {});
    }

    // “转发”计数 + 生成演示链接（只绑定一次）
    if (forwardBtn && !forwardBtn.hasAttribute('data-bound')) {
        forwardBtn.setAttribute('data-bound', 'true');
        let lastTap = 0;
        const onForward = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const now = Date.now();
            if (now - lastTap < 350) return; // 防止 touch+click 双触发
            lastTap = now;

            const realm = getActiveFullscreenRealm();
            const idx = getActiveFullscreenIndex();
            if (!document.body.classList.contains('share-view')) {
                const st = ensureEngagement(realm, idx);
                st.forward += 1;
                saveEngagementStats();
                renderEngagementCounts(realm, idx);
            }

            // 先弹出弹窗，给“正在生成”反馈（避免用户以为没触发）
            openShareLinkModal('正在生成截图，请稍候…');

            // 生成“截图链接”：对方打开看到整页截图（含Logo与注册码）
            const regCode = makeRegistrationCode();
            let shotDataUrl = '';
            try {
                shotDataUrl = await withTimeout(generateFullscreenScreenshotJpeg(regCode), 4500, '生成截图超时');
            } catch (err) {
                console.error('❌ 生成截图失败', err);
                const isFile = window.location.protocol === 'file:';
                setShareLinkModalText(
                    isFile
                        ? '生成截图失败：你现在用 file:// 本地文件方式打开，浏览器常禁止导出截图。建议用本地服务器打开（http://localhost）后再试。'
                        : '生成截图失败：你的浏览器可能禁止从视频/图片生成截图。请点“保存截图”改为直接保存后发送图片。'
                );
                showToast('生成截图失败（已在弹窗提示原因）', 2200);
                return;
            }

            const link = buildShotLink(shotDataUrl);
            // 链接可能过长：仍给出，但提示更推荐直接保存截图发送
            if (link.length > 12000) {
                showToast('链接很长，部分聊天可能发不出去。建议直接“保存截图”发送图片。', 2600);
            }
            // 在弹窗里展示链接 + 预览截图
            const input = document.getElementById('share-link-input');
            if (input) input.value = link;
            const previewImg = document.getElementById('share-shot-preview');
            if (previewImg) {
                previewImg.src = shotDataUrl;
                previewImg.style.display = 'block';
            }

            const ok = await copyTextToClipboard(link);
            showToast(ok ? '已复制截图链接' : '自动复制失败，请在弹窗内手动复制', 1800);
        };
        forwardBtn.addEventListener('click', onForward);
        forwardBtn.addEventListener('touchend', onForward, { passive: false });
    }
    
    // 绑定全屏按钮点击事件
    if (fullscreenCloseIcon) {
        fullscreenCloseIcon.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleFullscreen();
        };
    }

    // 启动轮播（默认未锁定）
    startFullscreenCarousel();
    
    console.log('✅ 已进入全屏模式');
}

// 退出全屏
function exitFullscreen() {
    const fullscreenModal = document.getElementById('fullscreen-modal');
    const fullscreenImage = document.getElementById('fullscreen-image');
    const fullscreenThoughtText = document.getElementById('fullscreen-thought-text');
    const fullscreenBirthDeath = document.getElementById('fullscreen-birth-death');
    const candleVideo = document.getElementById('fullscreen-candle-video');
    const candleVideo5 = document.getElementById('fullscreen-candle-video-5');
    
    if (!fullscreenModal || !fullscreenImage) {
        return;
    }
    
    // 隐藏全屏模态
    fullscreenModal.style.display = 'none';
    fullscreenImage.style.display = 'none';
    if (fullscreenThoughtText) {
        fullscreenThoughtText.style.display = 'none';
        fullscreenThoughtText.style.visibility = 'hidden';
        fullscreenThoughtText.blur?.();
    }
    if (fullscreenBirthDeath) {
        fullscreenBirthDeath.style.display = 'none';
        fullscreenBirthDeath.style.visibility = 'hidden';
        fullscreenBirthDeath.blur?.();
    }

    if (candleVideo) {
        try { candleVideo.pause(); } catch (_) {}
        candleVideo.style.display = 'none';
    }

    if (candleVideo5) {
        try { candleVideo5.pause(); } catch (_) {}
        candleVideo5.style.display = 'none';
    }
    
    isFullscreen = false;

    // 停止轮播
    stopFullscreenCarousel();
    
    // 恢复页面滚动
    document.body.style.overflow = '';
    document.documentElement.classList.remove('fullscreen-open');
    document.body.classList.remove('fullscreen-open');
    
    console.log('✅ 已退出全屏模式');
}

// 调整全屏内容尺寸（包括图片、按钮、文字）
function adjustFullscreenContentSize() {
    const fullscreenImage = document.getElementById('fullscreen-image');
    const fullscreenContent = document.getElementById('fullscreen-content');
    const fullscreenWrapper = document.querySelector('.fullscreen-image-wrapper');
    const fullscreenThoughtText = document.getElementById('fullscreen-thought-text');
    const fullscreenBirthDeath = document.getElementById('fullscreen-birth-death');
    const fullscreenCloseIcon = document.getElementById('fullscreen-close-icon-in-image');
    
    if (!fullscreenImage || !fullscreenContent) {
        return;
    }
    
    // 等待图片加载完成
    if (!fullscreenImage.complete || fullscreenImage.naturalWidth === 0) {
        setTimeout(adjustFullscreenContentSize, 100);
        return;
    }
    
    // 放大页整体画布已固定为与第一页一致的比例（393×851）
    // 这里避免使用 window.innerWidth（iOS/Safari 横向拖动/地址栏变化会导致 innerWidth 波动，出现“越拉越大”）
    const frameWidth = fullscreenContent.clientWidth || fullscreenContent.offsetWidth || document.documentElement.clientWidth;
    // 放大页图片框改为满宽（与第一页主图一致）
    const imageWidth = frameWidth;
    // 兼容兜底：部分 WebView 对 aspect-ratio 支持不稳定，用 JS 强制图片框高度
    if (fullscreenWrapper) {
        const h = imageWidth * (573.113 / 393);
        fullscreenWrapper.style.height = `${h}px`;
    }
    
    // 原始图片容器尺寸（在SVG中的尺寸）
    const originalImageWidth = 393; // 图片框宽度（左右贴边）
    
    // 计算缩放比例：基于满宽
    const scale = imageWidth / originalImageWidth;
    
    // 图片宽度由 CSS 控制：外层容器 95%，图片 100%
    // 这里不再写死 maxWidth=95%，避免出现 95% * 95% 的二次缩小
    fullscreenImage.style.width = '100%';
    fullscreenImage.style.maxWidth = '100%';
    // 高度由 .fullscreen-image-wrapper 固定；图片填满（与第一页一致）
    fullscreenImage.style.height = '100%';
    fullscreenImage.style.objectFit = 'cover';
    fullscreenImage.style.margin = '0'; // 由外层容器居中
    
    // 等待浏览器渲染后获取实际图片高度
    setTimeout(() => {
        // 获取图片实际显示宽度和高度
        const actualImageWidth = fullscreenImage.offsetWidth || imageWidth;
        let actualImageHeight = fullscreenImage.offsetHeight;
        if (!actualImageHeight || actualImageHeight === 0) {
            // 如果offsetHeight为0，尝试其他方法
            actualImageHeight = fullscreenImage.clientHeight;
            if (!actualImageHeight || actualImageHeight === 0) {
                // 使用自然高度和实际图片宽度计算
                actualImageHeight = (fullscreenImage.naturalHeight / fullscreenImage.naturalWidth) * actualImageWidth;
            }
        }
        
        console.log('📐 图片尺寸信息:', {
            offsetWidth: fullscreenImage.offsetWidth,
            offsetHeight: fullscreenImage.offsetHeight,
            clientHeight: fullscreenImage.clientHeight,
            naturalWidth: fullscreenImage.naturalWidth,
            naturalHeight: fullscreenImage.naturalHeight,
            frameWidth: frameWidth,
            imageWidth: imageWidth,
            actualImageWidth: actualImageWidth,
            scale: scale.toFixed(2),
            actualImageHeight: actualImageHeight
        });
        
        // 全屏按钮位置由 CSS 控制（固定在图片右上角，确保在图片内部）
        // 放大页文字按比例定位（且仅影响放大页）
        layoutFullscreenTextOverlays();
        applyFullscreenImageTransform(getActiveFullscreenRealm(), getActiveFullscreenIndex());

        // 调整文字位置和大小（保持在图片上的原比例位置）
        // 原始位置计算：
        // 图片框：x=0, y=159, width=393, height=573.113
        // 思念文字：x=196.5, y=632
        // 生卒年：x=196.5, y=662
        // 相对于图片框的位置：
        // 思念文字：x相对=196.5（图片中心），y相对=473
        // 生卒年：x相对=196.5（图片中心），y相对=503
        
        const originalImageWidth = 393;
        const originalImageHeight = 573.113;
        
        // 确保放大页文字显示（可编辑，不回写主页面）
        if (fullscreenThoughtText) {
            fullscreenThoughtText.style.display = 'block';
            fullscreenThoughtText.style.visibility = 'visible';
        }
        if (fullscreenBirthDeath) {
            fullscreenBirthDeath.style.display = 'block';
            fullscreenBirthDeath.style.visibility = 'visible';
        }
        
        console.log('📐 全屏内容已缩放，比例:', scale.toFixed(2), 'frameWidth:', frameWidth, 'x', actualImageHeight.toFixed(2));
        
        // 再次布局一次，确保在最终尺寸下按比例定位
        setTimeout(() => {
            layoutFullscreenTextOverlays();
            try { adjustFullscreenOverlayIconColors(); } catch (_) {}
            try { adjustFullscreenNoteTextColor(); } catch (_) {}
            applyFullscreenImageTransform(getActiveFullscreenRealm(), getActiveFullscreenIndex());
        }, 50);
    }, 100);
}

function applyFullscreenImageTransform(realm, index) {
    const img = document.getElementById('fullscreen-image');
    const wrapper = document.querySelector('.fullscreen-image-wrapper');
    if (!img || !wrapper) return;
    if (!isFullscreen) return;

    const apply = () => {
        const containerWidth = wrapper.clientWidth || wrapper.offsetWidth;
        const containerHeight = wrapper.clientHeight || wrapper.offsetHeight;
        if (!containerWidth || !containerHeight) return;
        if (!img.naturalWidth || !img.naturalHeight) return;

        const scaleCover = Math.max(containerWidth / img.naturalWidth, containerHeight / img.naturalHeight);
        const displayWidth = img.naturalWidth * scaleCover;
        const displayHeight = img.naturalHeight * scaleCover;
        const baseLeft = (containerWidth - displayWidth) / 2;
        const baseTop = (containerHeight - displayHeight) / 2;

        img.style.position = 'absolute';
        img.style.left = `${baseLeft}px`;
        img.style.top = `${baseTop}px`;
        img.style.width = `${displayWidth}px`;
        img.style.height = `${displayHeight}px`;
        img.style.transformOrigin = '0 0';

        const saved = getImageTransform(realm, index);
        if (saved) {
            const clamped = clampImageTranslate(baseLeft, baseTop, displayWidth, displayHeight, containerWidth, containerHeight, saved.scale, saved.tx, saved.ty);
            img.style.transform = `translate(${clamped.tx}px, ${clamped.ty}px) scale(${saved.scale})`;
        } else {
            img.style.transform = 'translate(0px, 0px) scale(1)';
        }
    };

    if (img.complete && img.naturalWidth) {
        apply();
    } else {
        img.onload = () => apply();
    }
}

// 监听窗口大小变化：仅重新布局放大页文字（不改图片逻辑）
window.addEventListener('resize', function() {
    if (!isFullscreen) return;
    setTimeout(() => {
        layoutFullscreenTextOverlays();
    }, 50);
});

// 监听ESC键退出全屏
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isFullscreen) {
        exitFullscreen();
    }
});

// 放大页：禁止“点背景退出”，只允许点右上角图标缩小（避免误触）
document.addEventListener('click', function(e) {
    // no-op (kept for backward compatibility)
}, true);

// 初始化全屏关闭按钮
function initFullscreenCloseBtn() {
    const fullscreenCloseBtn = document.querySelector('.fullscreen-close-btn');
    if (fullscreenCloseBtn) {
        fullscreenCloseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            exitFullscreen();
        });
    }
}
