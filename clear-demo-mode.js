// 清理演示模式设置
console.log('清理演示模式设置...');

// 模拟浏览器localStorage清理
const demoMode = localStorage.getItem('demo_mode');
if (demoMode) {
  localStorage.removeItem('demo_mode');
  console.log('已清理演示模式设置');
} else {
  console.log('未检测到演示模式设置');
}

console.log('系统将使用真实的数据库连接');