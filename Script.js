// BerKahCandle - Trading Application
// Main JavaScript File

let chart;
let candleSeries;
let volumeSeries;
let currentSymbol = 'BTCUSD';
let currentTimeframe = '60';
let currentTool = 'cursor';
let indicators = {
    sma20: true,
    sma50: false,
    ema20: false,
    ema50: false,
    rsi: false,
    macd: false,
    bollinger: false,
    volume: true,
    stochastic: false,
    adx: false
};

let positions = [
    { symbol: 'BTCUSD', type: 'BUY', size: 0.5, entry: 41200, current: 42350 }
];

let orders = [
    { symbol: 'ETHUSD', type: 'Limit', side: 'BUY', price: 2200, size: 1.0 }
];

// Initialize Chart
function initChart() {
    const chartContainer = document.getElementById('chart');
    
    chart = LightweightCharts.createChart(chartContainer, {
        width: chartContainer.clientWidth,
        height: chartContainer.clientHeight,
        layout: {
            backgroundColor: '#131722',
            textColor: '#d1d4dc',
        },
        grid: {
            vertLines: {
                color: '#2a2e39',
            },
            horzLines: {
                color: '#2a2e39',
            },
        },
        crosshair: {
            mode: LightweightCharts.CrosshairMode.Normal,
        },
        timeScale: {
            borderColor: '#363a45',
            timeVisible: true,
            secondsVisible: false,
        },
        rightPriceScale: {
            borderColor: '#363a45',
        },
    });

    candleSeries = chart.addCandlestickSeries({
        upColor: '#00c853',
        downColor: '#ff5252',
        borderUpColor: '#00c853',
        borderDownColor: '#ff5252',
        wickUpColor: '#00c853',
        wickDownColor: '#ff5252',
    });

    volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
            type: 'volume',
        },
        priceScaleId: '',
        scaleMargins: {
            top: 0.8,
            bottom: 0,
        },
    });

    // Handle resize
    window.addEventListener('resize', () => {
        chart.applyOptions({
            width: chartContainer.clientWidth,
            height: chartContainer.clientHeight,
        });
    });

    // Load initial data
    loadChartData(currentSymbol);
}

// Generate Sample Data
function generateData(symbol, timeframe) {
    const data = [];
    const volumeData = [];
    let basePrice = getBasePrice(symbol);
    let time = Math.floor(Date.now() / 1000) - (1000 * parseInt(timeframe) * 60);
    
    for (let i = 0; i < 1000; i++) {
        const volatility = basePrice * 0.02;
        const open = basePrice;
        const close = basePrice + (Math.random() - 0.5) * volatility;
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;
        
        data.push({
            time: time + (i * parseInt(timeframe) * 60),
            open: open,
            high: high,
            low: low,
            close: close,
        });
        
        volumeData.push({
            time: time + (i * parseInt(timeframe) * 60),
            value: Math.random() * 1000 + 500,
            color: close >= open ? '#00c853' : '#ff5252',
        });
        
        basePrice = close;
    }
    
    return { candleData: data, volumeData: volumeData };
}

function getBasePrice(symbol) {
    const prices = {
        'BTCUSD': 42000,
        'ETHUSD': 2250,
        'EURUSD': 1.095,
        'GBPUSD': 1.274,
        'XAUUSD': 1925,
        'AAPL': 175,
        'TSLA': 246,
        'GOOGL': 135.5
    };
    return prices[symbol] || 100;
}

// Load Chart Data
function loadChartData(symbol) {
    document.getElementById('loading').classList.add('active');
    
    setTimeout(() => {
        const generatedData = generateData(symbol, currentTimeframe);
        candleSeries.setData(generatedData.candleData);
        volumeSeries.setData(generatedData.volumeData);
        
        // Update indicators
        updateIndicators(generatedData.candleData);
        
        // Update UI
        document.getElementById('currentSymbol').textContent = symbol.replace('USD', '/USD');
        const lastPrice = generatedData.candleData[generatedData.candleData.length - 1].close;
        document.getElementById('currentPrice').textContent = lastPrice.toFixed(symbol.includes('JPY') ? 2 : (lastPrice < 10 ? 4 : 2));
        
        const change = ((lastPrice - getBasePrice(symbol)) / getBasePrice(symbol) * 100).toFixed(2);
        const changeEl = document.getElementById('priceChange');
        changeEl.textContent = (change >= 0 ? '+' : '') + change + '%';
        changeEl.className = change >= 0 ? 'positive' : 'negative';
        
        document.getElementById('orderPrice').value = lastPrice.toFixed(2);
        
        document.getElementById('loading').classList.remove('active');
    }, 500);
}

// Update Indicators
function updateIndicators(data) {
    // Simple Moving Average
    if (indicators.sma20) {
        const sma20Series = chart.addLineSeries({ color: '#2962ff', lineWidth: 2 });
        const sma20Data = calculateSMA(data, 20);
        sma20Series.setData(sma20Data);
    }
    
    if (indicators.sma50) {
        const sma50Series = chart.addLineSeries({ color: '#ff6d00', lineWidth: 2 });
        const sma50Data = calculateSMA(data, 50);
        sma50Series.setData(sma50Data);
    }
    
    // Bollinger Bands
    if (indicators.bollinger) {
        const bbData = calculateBollingerBands(data, 20, 2);
        
        const upperSeries = chart.addLineSeries({ color: '#00c853', lineWidth: 1 });
        upperSeries.setData(bbData.upper);
        
        const lowerSeries = chart.addLineSeries({ color: '#ff5252', lineWidth: 1 });
        lowerSeries.setData(bbData.lower);
    }
}

function calculateSMA(data, period) {
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += data[i - j].close;
        }
        result.push({
            time: data[i].time,
            value: sum / period
        });
    }
    return result;
}

function calculateBollingerBands(data, period, multiplier) {
    const upper = [];
    const lower = [];
    
    for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += data[i - j].close;
        }
        const sma = sum / period;
        
        let variance = 0;
        for (let j = 0; j < period; j++) {
            variance += Math.pow(data[i - j].close - sma, 2);
        }
        const stdDev = Math.sqrt(variance / period);
        
        upper.push({
            time: data[i].time,
            value: sma + (multiplier * stdDev)
        });
        
        lower.push({
            time: data[i].time,
            value: sma - (multiplier * stdDev)
        });
    }
    
    return { upper, lower };
}

// Load Symbol
function loadSymbol(symbol) {
    currentSymbol = symbol;
    
    // Update watchlist active state
    document.querySelectorAll('.watchlist-item').forEach(item => {
        item.classList.remove('active');
        if (item.querySelector('.symbol').textContent === symbol) {
            item.classList.add('active');
        }
    });
    
    loadChartData(symbol);
}

// Search Symbol
function searchSymbol() {
    const query = document.getElementById('symbolSearch').value.toUpperCase();
    if (query) {
        loadSymbol(query);
    }
}

// Set Timeframe
function setTimeframe(tf) {
    currentTimeframe = tf;
    
    document.querySelectorAll('.btn-timeframe').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.includes(tf) || 
            (tf === '60' && btn.textContent === '1H') ||
            (tf === '240' && btn.textContent === '4H') ||
            (tf === 'D' && btn.textContent === '1D') ||
            (tf === 'W' && btn.textContent === '1W')) {
            btn.classList.add('active');
        }
    });
    
    loadChartData(currentSymbol);
}

// Set Tool
function setTool(tool) {
    currentTool = tool;
    
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.closest('.tool-btn').classList.add('active');
}

// Toggle Indicators
function toggleIndicator(indicator) {
    indicators[indicator] = !indicators[indicator];
    loadChartData(currentSymbol);
}

// Toggle Panels
function toggleIndicatorsPanel() {
    const panel = document.getElementById('indicatorsPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function toggleSettings() {
    alert('Settings panel - Coming soon!');
}

// Place Order
function placeOrder(side) {
    const qty = document.getElementById('orderQty').value;
    const price = document.getElementById('orderPrice').value;
    
    if (qty && price) {
        alert(`Order placed: ${side.toUpperCase()} ${qty} ${currentSymbol} @ ${price}`);
        
        // Add to positions
        positions.push({
            symbol: currentSymbol,
            type: side.toUpperCase(),
            size: parseFloat(qty),
            entry: parseFloat(price),
            current: parseFloat(price)
        });
        
        updatePositionsTable();
    } else {
        alert('Please enter quantity and price');
    }
}

// Update Positions Table
function updatePositionsTable() {
    const tbody = document.getElementById('positionsBody');
    tbody.innerHTML = '';
    
    positions.forEach((pos, index) => {
        const pl = (pos.current - pos.entry) * pos.size * (pos.type === 'BUY' ? 1 : -1);
        const row = `
            <tr>
                <td>${pos.symbol}</td>
                <td class="${pos.type.toLowerCase()}">${pos.type}</td>
                <td>${pos.size}</td>
                <td>${pos.entry.toFixed(2)}</td>
                <td>${pos.current.toFixed(2)}</td>
                <td class="${pl >= 0 ? 'positive' : 'negative'}">$${pl.toFixed(2)}</td>
                <td><button class="btn-close" onclick="closePosition(${index})">Close</button></td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// Close Position
function closePosition(index) {
    positions.splice(index, 1);
    updatePositionsTable();
}

// Cancel Order
function cancelOrder(index) {
    orders.splice(index, 1);
    document.getElementById('ordersBody').innerHTML = '';
    orders.forEach((order, i) => {
        const row = `
            <tr>
                <td>${order.symbol}</td>
                <td>${order.type}</td>
                <td class="${order.side.toLowerCase()}">${order.side}</td>
                <td>${order.price}</td>
                <td>${order.size}</td>
                <td><button class="btn-cancel" onclick="cancelOrder(${i})">Cancel</button></td>
            </tr>
        `;
        document.getElementById('ordersBody').innerHTML += row;
    });
}

// Show Tab
function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.textContent.toLowerCase() === tabName) {
            tab.classList.add('active');
        }
    });
    
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
}

// Toggle Fullscreen
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// Reset Chart
function resetChart() {
    chart.timeScale().fitContent();
}

// Screenshot Chart
function screenshotChart() {
    alert('Screenshot feature - In development');
}

// Toggle Menu (Mobile)
function toggleMenu() {
    const leftToolbar = document.getElementById('leftToolbar');
    const rightPanel = document.getElementById('rightPanel');
    
    if (leftToolbar.style.display === 'none') {
        leftToolbar.style.display = 'flex';
        rightPanel.style.display = 'flex';
    } else {
        leftToolbar.style.display = 'none';
        rightPanel.style.display = 'none';
    }
}

// Add Alert
function addAlert() {
    const symbol = prompt('Enter symbol:');
    const condition = prompt('Enter condition (e.g., > 43000 or < 2200):');
    
    if (symbol && condition) {
        const alertsList = document.getElementById('alertsList');
        const alertItem = `
            <div class="alert-item">
                <span class="alert-symbol">${symbol.toUpperCase()}</span>
                <span class="alert-condition">${condition}</span>
                <span class="alert-status active">Active</span>
                <button onclick="deleteAlert(${alertsList.children.length})">×</button>
            </div>
        `;
        alertsList.innerHTML += alertItem;
    }
}

// Delete Alert
function deleteAlert(index) {
    const alertsList = document.getElementById('alertsList');
    alertsList.children[index].remove();
}

// Update Prices (Simulated)
function updatePrices() {
    const symbols = ['BTCUSD', 'ETHUSD', 'EURUSD', 'GBPUSD', 'XAUUSD', 'AAPL', 'TSLA', 'GOOGL'];
    
    symbols.forEach(symbol => {
        const priceEl = document.getElementById(`price-${symbol}`);
        const changeEl = document.getElementById(`change-${symbol}`);
        
        if (priceEl && changeEl) {
            const basePrice = getBasePrice(symbol);
            const change = (Math.random() - 0.5) * 2;
            const newPrice = basePrice * (1 + change / 100);
            
            priceEl.textContent = newPrice.toFixed(symbol.includes('JPY') ? 2 : (newPrice < 10 ? 4 : 2));
            changeEl.textContent = (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
            changeEl.className = `change ${change >= 0 ? 'positive' : 'negative'}`;
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    
    // Update prices every 5 seconds
    setInterval(updatePrices, 5000);
    
    // Handle enter key in search
    document.getElementById('symbolSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchSymbol();
        }
    });
});

console.log('BerKahCandle initialized successfully!');
