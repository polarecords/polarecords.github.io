(function() {
    const fab = document.getElementById('xp-fab-menu');
    if (!fab) return;

    // Create the pop-up menu structure
    const menu = document.createElement('div');
    menu.id = 'xp-menu-popup';
    menu.style.cssText = 'position:fixed; bottom:50px; left:12px; width:200px; background:#e0e0e0; border:2px solid #fff; box-shadow:2px 2px 5px rgba(0,0,0,0.5); display:none; z-index:99998; font-family:Tahoma, sans-serif; padding:5px;';
    
    menu.innerHTML = `
        <div style="background:#000080; color:white; padding:5px; font-weight:bold; margin-bottom:5px;">PolaRecords Start</div>
        <ul style="list-style:none; padding:0; margin:0;">
            <li style="padding:5px; cursor:pointer;" onmouseover="this.style.background='#000080'; this.style.color='white'" onmouseout="this.style.background='transparent'; this.style.color='black'" onclick="window.location.href='/index.html'">Home</li>
            <li style="padding:5px; cursor:pointer;" onmouseover="this.style.background='#000080'; this.style.color='white'" onmouseout="this.style.background='transparent'; this.style.color='black'" onclick="window.location.href='/johnpolar/'">John Polar</li>
            <li style="padding:5px; cursor:pointer;" onmouseover="this.style.background='#000080'; this.style.color='white'" onmouseout="this.style.background='transparent'; this.style.color='black'" onclick="window.location.href='/polaraf/'">PølarAF</li>
            <li style="padding:5px; cursor:pointer;" onmouseover="this.style.background='#000080'; this.style.color='white'" onmouseout="this.style.background='transparent'; this.style.color='black'" onclick="window.location.href='/polarx/'">PolarX</li>
        </ul>
    `;
    document.body.appendChild(menu);

    fab.addEventListener('click', function(e) {
        e.stopPropagation();
        menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
    });

    document.addEventListener('click', function() {
        menu.style.display = 'none';
    });
})();
