// 基于本地存储的机构管理服务（用于演示和测试）

/**
 * 本地存储机构管理服务
 * 使用localStorage存储机构数据（浏览器环境）或内存存储（Node.js环境）
 */
export class OrganizationLocalService {
  constructor() {
    this.storageKey = 'practice_organizations';
    this.initialized = false;
    this.inMemoryData = []; // Node.js环境下的内存存储
    
    // 检测当前环境
    this.isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
    console.log(`机构服务初始化: ${this.isBrowser ? '浏览器环境' : 'Node.js环境'}`);
  }

  /**
   * 初始化服务
   */
  async initialize() {
    if (!this.initialized) {
      // 检查是否已有数据，如无则初始化示例数据
      const existingData = this.getAllOrganizations();
      if (!existingData || existingData.length === 0) {
        await this.batchAddTestOrganizations(3);
        console.log('本地存储初始化完成，已添加示例数据');
      }
      this.initialized = true;
    }
    return { success: true, message: '本地存储服务已初始化' };
  }

  /**
   * 获取所有机构
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 机构列表和总数
   */
  async getOrganizations(options = {}) {
    const { search = '', type = '', page = 1, pageSize = 10 } = options;
    
    let organizations = this.getAllOrganizations();
    
    // 搜索过滤
    if (search) {
      const searchLower = search.toLowerCase();
      organizations = organizations.filter(org => 
        org.name.toLowerCase().includes(searchLower) || 
        org.code.toLowerCase().includes(searchLower) ||
        org.description.toLowerCase().includes(searchLower)
      );
    }
    
    // 类型过滤
    if (type) {
      organizations = organizations.filter(org => org.type === type);
    }
    
    // 排序（按创建时间倒序）
    organizations.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // 分页
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedOrganizations = organizations.slice(start, end);
    
    return {
      data: paginatedOrganizations,
      totalCount: organizations.length,
      page,
      pageSize
    };
  }

  /**
   * 根据ID获取机构详情
   * @param {string} id 机构ID
   * @returns {Promise<Object|null>} 机构详情或null
   */
  async getOrganizationById(id) {
    const organizations = this.getAllOrganizations();
    return organizations.find(org => org.id === id) || null;
  }

  /**
   * 添加机构
   * @param {Object} organizationData 机构数据
   * @returns {Promise<Object>} 操作结果
   */
  async addOrganization(organizationData) {
    try {
      // 验证数据
      if (!organizationData.name || !organizationData.code || !organizationData.type) {
        throw new Error('机构名称、代码和类型为必填项');
      }

      // 生成唯一ID
      const newOrganization = {
        id: this.generateId(),
        name: organizationData.name,
        code: organizationData.code,
        type: organizationData.type,
        address: organizationData.address || '',
        description: organizationData.description || '',
        created_by: organizationData.created_by || 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 保存到存储
      const organizations = this.getAllOrganizations();
      organizations.push(newOrganization);
      this.saveOrganizations(organizations);

      console.log('✅ 成功添加机构:', newOrganization.name);
      return newOrganization;
    } catch (error) {
      console.error('❌ 添加机构失败:', error.message);
      throw error;
    }
  }

  /**
   * 更新机构
   * @param {string} id 机构ID
   * @param {Object} organizationData 更新数据
   * @returns {Promise<Object>} 更新后的机构
   */
  async updateOrganization(id, organizationData) {
    try {
      const organizations = this.getAllOrganizations();
      const index = organizations.findIndex(org => org.id === id);
      
      if (index === -1) {
        throw new Error('机构不存在');
      }

      // 更新机构数据
      organizations[index] = {
        ...organizations[index],
        ...organizationData,
        updated_at: new Date().toISOString()
      };

      // 保存更新
      this.saveOrganizations(organizations);

      console.log('✅ 成功更新机构:', organizations[index].name);
      return organizations[index];
    } catch (error) {
      console.error('❌ 更新机构失败:', error.message);
      throw error;
    }
  }

  /**
   * 删除机构
   * @param {string} id 机构ID
   * @returns {Promise<boolean>} 操作结果
   */
  async deleteOrganization(id) {
    try {
      const organizations = this.getAllOrganizations();
      const filteredOrganizations = organizations.filter(org => org.id !== id);
      
      if (filteredOrganizations.length === organizations.length) {
        throw new Error('机构不存在');
      }

      this.saveOrganizations(filteredOrganizations);
      console.log('✅ 成功删除机构:', id);
      return true;
    } catch (error) {
      console.error('❌ 删除机构失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取机构类型统计
   * @returns {Promise<Object>} 类型统计数据
   */
  async getOrganizationTypeStats() {
    const organizations = this.getAllOrganizations();
    const stats = {};
    
    organizations.forEach(org => {
      if (!stats[org.type]) {
        stats[org.type] = 0;
      }
      stats[org.type]++;
    });
    
    return stats;
  }

  /**
   * 批量添加测试数据
   * @param {number} count 每种类型添加的数量
   * @returns {Promise<Object>} 操作结果
   */
  async batchAddTestOrganizations(count = 1) {
    const types = ['school', 'enterprise', 'government'];
    const results = {};
    let successCount = 0;
    const totalCount = types.length * count;
    
    types.forEach(type => {
      results[type] = [];
      for (let i = 1; i <= count; i++) {
        try {
          const orgData = this.generateTestOrganization(type, i);
          const org = this.addOrganizationSync(orgData);
          results[type].push(org);
          successCount++;
        } catch (error) {
          console.error(`添加测试${type}机构失败 #${i}:`, error.message);
        }
      }
    });
    
    return {
      successCount,
      totalCount,
      results
    };
  }

  /**
   * 初始化数据库说明（本地存储版本）
   * @returns {Promise<Object>} 初始化说明
   */
  async initializeDatabase() {
    return {
      success: true,
      message: '本地存储模式已就绪，无需数据库配置',
      notes: '此服务使用localStorage存储数据，适用于演示和测试环境。'
    };
  }

  // 私有辅助方法
  
  /**
   * 获取所有机构（兼容浏览器和Node.js环境）
   * @private
   */
  getAllOrganizations() {
    try {
      if (this.isBrowser) {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
      } else {
        // Node.js环境下使用内存存储
        return this.inMemoryData;
      }
    } catch (error) {
      console.error('读取存储失败:', error);
      return [];
    }
  }

  /**
   * 保存机构数据（兼容浏览器和Node.js环境）
   * @private
   */
  saveOrganizations(organizations) {
    try {
      if (this.isBrowser) {
        localStorage.setItem(this.storageKey, JSON.stringify(organizations));
      } else {
        // Node.js环境下更新内存存储
        this.inMemoryData = organizations;
      }
    } catch (error) {
      console.error('保存到存储失败:', error);
      throw new Error('数据保存失败');
    }
  }

  /**
   * 生成唯一ID
   * @private
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 生成测试机构数据
   * @private
   */
  generateTestOrganization(type, index) {
    const typeNames = {
      school: '学校',
      enterprise: '企业',
      government: '政府部门'
    };

    return {
      name: `${typeNames[type]}测试${index}`,
      code: `${type.toUpperCase()}${String(index).padStart(3, '0')}`,
      type: type,
      address: `测试地址${index}`,
      description: `这是${typeNames[type]}类型的测试数据，用于功能验证`,
      created_by: 'system'
    };
  }

  /**
   * 同步添加机构（用于批量测试）
   * @private
   */
  addOrganizationSync(organizationData) {
    const newOrganization = {
      id: this.generateId(),
      name: organizationData.name,
      code: organizationData.code,
      type: organizationData.type,
      address: organizationData.address || '',
      description: organizationData.description || '',
      created_by: organizationData.created_by || 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const organizations = this.getAllOrganizations();
    organizations.push(newOrganization);
    this.saveOrganizations(organizations);

    return newOrganization;
  }
}

// 创建单例实例
export const organizationService = new OrganizationLocalService();

// 导出便捷方法
export const {
  initialize,
  getOrganizations,
  getOrganizationById,
  addOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationTypeStats,
  batchAddTestOrganizations,
  initializeDatabase
} = {
  initialize: (...args) => organizationService.initialize(...args),
  getOrganizations: (...args) => organizationService.getOrganizations(...args),
  getOrganizationById: (...args) => organizationService.getOrganizationById(...args),
  addOrganization: (...args) => organizationService.addOrganization(...args),
  updateOrganization: (...args) => organizationService.updateOrganization(...args),
  deleteOrganization: (...args) => organizationService.deleteOrganization(...args),
  getOrganizationTypeStats: (...args) => organizationService.getOrganizationTypeStats(...args),
  batchAddTestOrganizations: (...args) => organizationService.batchAddTestOrganizations(...args),
  initializeDatabase: (...args) => organizationService.initializeDatabase(...args)
};