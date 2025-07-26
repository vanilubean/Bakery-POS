// BE NOT AFRAID
const sales = [];
let allProducts = [];

const savedSales = localStorage.getItem('sales');
if (savedSales) {
  sales.push(...JSON.parse(savedSales));
}

// HEADER ////////////////////////////////////////////////////////////////////////

// TOGGLE DARK MODE
function toggleDarkMode() {
  document.getElementById('darkModeToggle').addEventListener('click', () => {

    document.body.classList.toggle('dark-mode');

    const icon = document.getElementById('darkModeIcon');
    const isDark = document.body.classList.contains('dark-mode');

    icon.src = isDark ? 'icons/moon-stars.svg' : 'icons/moon.svg';
    icon.alt = isDark ? 'Light Mode' : 'Dark Mode';
  });
}

toggleDarkMode();

// TOGGLE MENU
window.toggleMenu = function () {
  const menu = document.getElementById('menuButtons');
  menu.classList.toggle('hidden');
}

// TOGGLE SIDE BAR
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const isActive = sidebar.classList.toggle('active');
}

// CLOSE SIDEBAR
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('active');
}

// AUTO-CLOSE SIDEBAR WHEN BUTTONS CLICKED
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const buttons = sidebar.querySelectorAll('button, label');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      closeSidebar(); // Hide sidebar after any button/label is clicked
    });
  });
});

// CLOSE SIDEBAR IF CLICKED OUTSIDE
document.addEventListener('click', function(event) {
  const sidebar     = document.getElementById('sidebar');
  const toggleBtn   = document.getElementById('menuToggleBtn');

  const clickedInsideSidebar = sidebar.contains(event.target);
  const clickedToggleButton  = toggleBtn.contains(event.target);

  if (!clickedInsideSidebar && !clickedToggleButton) {
    sidebar.classList.remove('active');
  }
});



// INPUT FILE TYPE
document.getElementById('excelFile').addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    loadProductsFromExcelJSON(json);
  };
  reader.readAsArrayBuffer(file);
});


// PLUGINS AND FILE CHOOSER
document.addEventListener('deviceready', function () {
  // REQUEST PERMISSIONS
  const permissions = cordova.plugins.permissions;
  permissions.requestPermissions(
    [
      permissions.READ_EXTERNAL_STORAGE,
      permissions.WRITE_EXTERNAL_STORAGE
    ],
    status => {
      if (!status.hasPermission) {
        alert("Please allow file permissions.");
      }
    },
    error => {
      console.error('Permission request error:', error);
    }
  );

  // FILE CHOOSER LOGIC
  document.getElementById('importBtn').addEventListener('click', () => {
    if (!window.fileChooser || !window.FilePath) {
      alert("File chooser not available. Make sure you're running this as an app.");
      return;
    }

    window.fileChooser.open(
      {
        mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      uri => {
        window.FilePath.resolveNativePath(uri, filePath => {
          window.resolveLocalFileSystemURL(filePath, fileEntry => {
            fileEntry.file(file => {
              const reader = new FileReader();
              reader.onloadend = function (e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                loadProductsFromExcelJSON(json);
              };
              reader.readAsArrayBuffer(file);
            }, err => {
              alert('Failed to read file.');
              console.error(err);
            });
          });
        }, err => {
          alert('Could not resolve file path.');
          console.error(err);
        });
      },
      err => {
        alert('File pick cancelled or failed.');
        console.error(err);
      }
    );
  });
});

// HEADER SECTION ///////////////////////////////////////////////////////////////////

// LOAD PRODUCTS
function loadProductsFromExcelJSON(json) {
  const categories = [
    { col: 0, name: 'pastry' },
    { col: 3, name: 'grocery' },
    { col: 6, name: 'frozen' },
    { col: 9, name: 'others' }
  ];

  const products = [];

  categories.forEach(({ col, name }) => {
    for (let row = 2; row < json.length; row++) {
      const rowData = json[row];
      const product = rowData[col];
      const price = rowData[col + 1];

      if (product && price) {
        products.push({
          name: product,
          price: Number(price),
          category: name
        });
      }
    }
  });

  loadProducts(products);
}

// SAVE TEXT TO FILE
function saveTextToFile(text, filename) {
  const downloadsPath = cordova.file.externalRootDirectory + "Download/";


  window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory + 'Download/', dirEntry => {
    
    dirEntry.getFile(filename, { create: true }, fileEntry => {
      fileEntry.createWriter(fileWriter => {
        fileWriter.write(new Blob([text], { type: 'text/plain' }));
        alert(`${filename} saved to Downloads folder.`);
      }, err => {
        alert("Error creating file: " + JSON.stringify(err));
        console.error("File creation error", err);
      });
    }, err => {
      alert("Error creating file.");
      console.error("File creation error", err);
    });
  }, err => {
    alert("Unable to access Downloads folder.");
    console.error("Directory access error", err);
  });
}

// PRODUCT SECTION ///////////////////////////////////////////////////////////////////

// LOAD PRODUCTS
function loadProducts(data) {
  allProducts = data;
  renderProducts(); // REFRESH BUTTONS
}

// RENDER PRODUCTS
function renderProducts(category = 'all', searchTerm = '') {
  const productGrid     = document.getElementById('productGrid');
  productGrid.innerHTML = '';

  const searchWords     = searchTerm.toLowerCase().split(' ').filter(Boolean);
  const filtered        = allProducts.filter(p => {
    const name = p.name.toLowerCase();

    const matchesCategory = (category === 'all' || p.category === category);
    const matchesSearch   = searchWords.every(word => name.includes(word));

    return matchesCategory && matchesSearch;
  });

  filtered.forEach(item => {
    const btn         = document.createElement('button');
    btn.innerText     = `${item.name}`;
    btn.onclick       = () => addItem(item);
    productGrid.appendChild(btn);
  });
}

// SEARCH PRODUCTS
const productSearch = document.getElementById('productSearch');

// Live filtering on input
productSearch.addEventListener('input', e => {
  const activeCategory = document.querySelector('.filter-btn.active')?.getAttribute('data-category') || 'all';
  renderProducts(activeCategory, e.target.value);
});

// Blur only when Enter is pressed
productSearch.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    e.target.blur();         // CLOSE KEYBOARD
    window.scrollTo(0, 0);   // SCROLL RESET
  }
});

// PRODUCT FILTER CATERGORY
function setupFilters() {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b =>  b.classList.remove('active'));
                            btn.classList.add ('active');
      const cat           = btn.getAttribute  ('data-category');
      const searchTerm    = document.getElementById('productSearch')?.value || '';
        renderProducts(cat, searchTerm);
    });
  });
}

// PRODUCT SEARCH
document.addEventListener("DOMContentLoaded", () => {
  setupFilters();
  const activeCategory  = document.querySelector('.filter-btn.active')?.getAttribute('data-category') || 'all';
  const searchTerm      = document.getElementById('productSearch')?.value || '';

renderProducts(activeCategory, searchTerm);
  if (typeof setupDB === 'function') setupDB(); // ONLY CALL IF DEFINED
});

// PRODUCT CLEAR SEARCH
function clearSearch() {
  const searchInput     = document.getElementById ('productSearch');
  searchInput.value     = '';

  const activeCategory  = document.querySelector  ('.filter-btn.active')?.getAttribute('data-category') || 'all';
  renderProducts(activeCategory, '');
}


// ORDER SECTION /////////////////////////////////////////////////////////////////////
const orderItems = [];


// ADD ITEMS
function addItem(item) {
  // Check if item already in order list
  const existing = orderItems.find(i => i.name === item.name);

  if (existing) {
    existing.qty  += 1;
    existing.total = existing.qty * existing.price;  }
  
  else {  orderItems.push({ ...item, qty: 1, total: item.price, id: Date.now() + Math.random() });
 }

  renderOrder();
}

// DEFINE SWIPE DETECTION
let startX = 0;

function handleTouchStart(e) {
  startX = e.changedTouches[0].clientX;
}

function handleTouchEnd(e, id) {
  const endX = e.changedTouches[0].clientX;
  const diffX = endX - startX;

  if (Math.abs(diffX) > 150) {
    const item = document.querySelector(`.order-item[data-id="${id}"]`);
    if (!item || item.classList.contains('is-removing')) return;

    item.classList.add(diffX > 0 ? 'swiped-right' : 'swiped-left', 'is-removing');

    item.classList.add('collapsing');
    setTimeout(() => {
      removeItemById(id);
    }, 300);
  }
}

function renderOrder() {
  const list      = document.getElementById('orderList');
  const totalEl   = document.getElementById('total');
  list.innerHTML  = '';

  let total = 0;

  orderItems.forEach((item, index) => {
    const li = document.createElement('li');
    li.classList.add('order-item');

    // ORDER BUTTONS // PRODUCT NAME // PRICE // QUANTITY // ETC //
    li.innerHTML = `
      <div class="left-group">
        <span class="qty-group">
          <span class="product-name">${item.name}</span>
          <span class="price">${item.total} PHP </span>
        </span>
      </div>

      <div class="right-group">
        <button class="icon-btn" onclick="changeQty(${index}, -1)">
          <img src="icons/minus-circle-filled.svg" alt="Minus" class="icon" />
        </button>
        <input type="number" class="qty-input" min="1" value="${item.qty}" onchange="updateQty(${index}, this.value)" />
        <button class="icon-btn" onclick="changeQty(${index}, 1)">
          <img src="icons/plus-circle-filled.svg" alt="Increase" class="icon" />
        </button>
      </div>
    `;
    
    li.setAttribute('data-id', item.id);
    list.appendChild(li);

    total += item.total;

    // SWIPE ITEMS
    li.classList.add('order-item');

    // Detect swipe gesture
    li.addEventListener('touchstart', handleTouchStart, false);
    li.addEventListener('touchend', (e) => handleTouchEnd(e, item.id), false);

  });

  totalEl.textContent = total;
  calculateChange();
}

// TOTAL AND CHANGE
function calculateChange() {
  const total   = parseFloat(document.getElementById('total').textContent);
  const cash    = parseFloat(document.getElementById('cashInput').value);
  const change  = (cash - total) >= 0 ? (cash - total) : 0;

  document.getElementById('change').textContent = change.toFixed(2);
}

// CHECKOUT PANEL
function updateQty(index, value) {
  const qty = parseInt(value);
  if (!isNaN(qty) && qty > 0) {
    orderItems[index].qty   = qty;
    orderItems[index].total = qty * orderItems[index].price;
    renderOrder();
  }
}

// CHANGE
function changeQty(index, change) {
  orderItems[index].qty += change;

  if    (  orderItems[index].qty <= 0) { orderItems.splice(index, 1); }
  else  {  orderItems[index].total = orderItems[index].qty * orderItems[index].price; }

  renderOrder();
}

function removeItemById(id) {
  const index = orderItems.findIndex(item => item.id === id);
  if (index !== -1) {
    orderItems.splice(index, 1);
    renderOrder();
  }
}

function clearOrder()       { 
  orderItems.length = 0; 
  renderOrder(); document.getElementById('cashInput').value = '';
  document.getElementById('orderPanel').scrollTop = 0;

}


// TRANSACTION SECTION /////////////////////////////////////////////////////////////////////

// CHECKOUT
function saveTransaction() {
  if (orderItems.length === 0) {
    alert("No items to save!");
    return;
  }

  const timestamp = new Date().toLocaleString();

  const orderSummary = {
    time: timestamp,
    items: orderItems.map(item => ({
      item:     item.name,
      quantity: item.qty,
      total:    item.total,
      category: item.category  // INCLUDE CATEGORY
    }))
  };

  sales.push(orderSummary);
  localStorage.setItem    ('sales', JSON.stringify(sales)); // SAVE TO LOCAL STORAGE

  // CASH INPUT
  document.getElementById('cashInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.blur(); // Closes mobile keyboard
    }
  });

  document.getElementById ('cashInput').value = '';
  document.getElementById ('change').textContent  = '0';
  clearOrder();
}

// SPREADSHEET ///////////////////////////////////////////////////////////////////

function handleFile(e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {

    const data      = new Uint8Array(e.target.result);
    const workbook  = XLSX.read(data, { type: 'array' });
    const sheet     = workbook.Sheets[workbook.SheetNames[0]];
    const json      = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // raw rows

    const categories = [
      { col: 0, name: 'pastry'  },
      { col: 3, name: 'grocery' },
      { col: 6, name: 'frozen'  },
      { col: 9, name: 'others'  }
    ];

    const products = [];

    categories.forEach(({ col, name }) => {
      // SKIP THE FIRST 2 ROWS (HEADER + LABELS)
      for (let row = 2; row < json.length; row++) {

        const rowData = json    [row];
        const product = rowData [col];
        const price   = rowData [col + 1];

        if (product && price) {
          products.push({
            name: product,
            price: Number(price),
            category: name
          });
        }

      }
    });

    loadProducts(products);
  };

  reader.readAsArrayBuffer(file);
}

// EXPORT DAILY SALES
function exportSalesRecord(callback) {
  if (sales.length === 0) {
    alert("No sales yet today.");
    return;
  }

  const rows = [["Date", "Time", "Item", "Quantity", "Total"]];

  sales.forEach(order => {
    order.items.forEach(item => {
      const [date, time] = order.time.split(", ");
      rows.push([date, time, item.item, item.quantity, item.total]);
    });
  });

  // ADD TOTAL SUM EARNINGS
  rows.push(["", "", "", "TOTAL:", { f: `SUM(E2:E${rows.length})` }]);

  // SHEET STYLING ////////////////////////////////////////////////////////////////
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // COLUMN AND ROW SIZES
  ws["!rows"] = [ { hpt: 24 } ];
  ws['!cols'] = [
      { wch: 20 }, // Column A
      { wch: 15 }, // Column B
      { wch: 30 }, // Column C
      { wch: 10 }, // Column D
      { wch: 10 }  // Column E
  ];

  // STYLE FIRST ROW
  const headerRow = rows[0];
  for (let col = 0; col < headerRow.length; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellRef]) continue;

    ws[cellRef].s = {
      font:       { bold: true, color:  { rgb: "FFFFFF" }     },
      fill:       { fgColor:            { rgb: "095932" }     },
      alignment:  { horizontal: "center", vertical: "center"  }
    };
  }

  // STYLE LAST ROW
  const lastRow = rows.length;
  ["A" + lastRow, "B" + lastRow, "C" + lastRow].forEach(cell => {
    if (!ws[cell]) return;

    ws[cell].s = {
      font:       { bold: true, color: { rgb: "FFFFFF" }      },
      fill:       {           fgColor: { rgb: "095932" }      },
      alignment:  { horizontal: "center", vertical: "center"  }
    };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sales");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });

  const buffer = new ArrayBuffer(wbout.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < wbout.length; ++i) {
    view[i] = wbout.charCodeAt(i) & 0xFF;
  }

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

  // FILE NAME
  const filename = `DailySales(${getFormattedDate()}).xlsx`;
  saveBlobToFile(blob, filename, callback);

}

// SALES SUMMARY ///////////////////////////////////////////////////////////////////
function exportSalesSummary(callback) {
  if (sales.length === 0) {
    alert("No sales to summarize.");
    return;
  }

  const categorySheets = {
    pastry:   {},
    grocery:  {},
    frozen:   {},
    others:   {}
  };

  sales.forEach(order => {
    order.items.forEach(item => {
      const cat = item.category || 'others';
      if (!categorySheets[cat][item.item]) {
        categorySheets[cat][item.item] = { quantity: 0, total: 0 };
      }
      categorySheets[cat][item.item].quantity += item.quantity;
      categorySheets[cat][item.item].total += item.total;
    });
  });

  const wb = XLSX.utils.book_new();

  Object.entries(categorySheets).forEach(([category, data]) => {
    const rows = [["Item Name", "Quantity Sold", "Total Sales"]];

    Object.entries(data).forEach(([name, record]) => {
      rows.push([name, record.quantity, record.total]);
    });

    // ADD TOTAL ROW AT THE END
    const rowNum = rows.length + 1; // EXCEL IS -1 INDEXED (idk wat dat means gigutom ko)
    rows.push([
      "TOTAL:",
      { f: `SUM(B2:B${rowNum - 1})` },  // QUANTITY COLUMN
      { f: `SUM(C2:C${rowNum - 1})` }   // TOTAL SALES COLUMN
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);

    ws['!cols'] = [
      { wch: 30 }, // Item Name
      { wch: 15 }, // Quantity
      { wch: 15 }  // Total
    ];

    XLSX.utils.book_append_sheet(wb, ws, category.charAt(0).toUpperCase() + category.slice(1));

  });

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
  const buffer = new ArrayBuffer(wbout.length);
  const view = new Uint8Array(buffer);

  for (let i = 0; i < wbout.length; ++i) {
    view[i] = wbout.charCodeAt(i) & 0xFF;
  }

  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

  // FILE NAME
  const filename = `SalesSummary(${getFormattedDate()}).xlsx`;
  saveBlobToFile(blob, filename, callback);

}

// GET FORMATTED DATE
function getFormattedDate() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0'); // MONTH IS 0-INDEXED
  const dd = String(now.getDate()).padStart(2, '0');
  const yyyy = now.getFullYear();

  return `${mm}-${dd}-${yyyy}`; // DATE OUTPUT
}

// SAVE BOB THE BLOB
function saveBlobToFile(blob, filename, callback = () => {}) {
  const downloadsPath = cordova.file.externalRootDirectory + "Download/";

  window.resolveLocalFileSystemURL(downloadsPath, dirEntry => {
    // Check if file exists
    dirEntry.getFile(filename, { create: false }, fileEntry => {
      console.log("File exists. Deleting:", filename);

      // Delete existing file
      fileEntry.remove(() => {
        console.log("File deleted. Proceeding to write.");
        writeFile(dirEntry); // Write after deletion
      }, err => {
        console.warn("Failed to delete file:", err);
        alert("Failed to delete old file. Try manually deleting.");
      });
    }, err => {
      // File doesn't exist — just write
      console.log("File doesn't exist. Writing new one.");
      writeFile(dirEntry);
    });

    function writeFile(dirEntry) {
      dirEntry.getFile(filename, { create: true }, fileEntry => {
        fileEntry.createWriter(fileWriter => {
          fileWriter.onwriteend = () => {
            alert(`${filename} saved to Downloads folder.`);
            callback();
          };

          fileWriter.onerror = err => {
            alert("Error writing file.");
            console.error("Writer error", err);
          };

          fileWriter.write(blob);
        }, err => {
          alert("Error creating writer.");
          console.error("Writer creation error", err);
        });
      }, err => {
        alert("Error creating file.");
        console.error("File creation error", err);
      });
    }
  }, err => {
    alert("Unable to access Downloads folder.");
    console.error("Directory access error", err);
  });
}


// END DAY ///////////////////////////////////////////////////////////////////

function endDay() {
  if (sales.length === 0) {
    alert("No sales to export.");
    return;
  }

  // CONFIRMATION WARNING
  if (!confirm("Are you sure you want to end the day? This will export and clear today's sales.")) {
    return;
  }

  exportSalesSummary(() => { // EXPORT TODAY'S SALE SUMMARY
  exportSalesRecord(() => {  // EXPORT TODAY'S SALE RECORD

  // CLEAR SAVED SALES FROM LOCAL STORAGE
  localStorage.removeItem('sales');  
  sales.length = 0;
  
  alert("Sales exported and cleared. Ready for a new day!");
   });
  });
}