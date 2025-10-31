// 机构管理后端逻辑服务
import { supabase } from '../lib/supabaseClient.js';

/**
 * 机构管理服务类
 * 处理机构的增删改查操作，确保数据正确保存到数据库
 */
class OrganizationService {
  /**
   * 获取机构列表
   * @param {Object} params - 查询参数
   * @param {string} params.name - 机构名称搜索
   * @param {string} params.type - 机构类型过滤
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页数量
   * @returns {Promise<Object>} 机构列表和分页信息
   */
  async getOrganizations(params = {}) {
    try {
      // 构建查询
      let query = supabase
        .from('organizations')
        .select('*', { count: 'exact' });

      // 添加搜索条件
      if (params.name) {
        query = query.ilike('name', `%${params.name}%`);
      }
      
      if (params.type) {
        query = query.eq('type', params.type);
      }

      // 添加分页
      if (params.page && params.pageSize) {
        const start = (params.page - 1) * params.pageSize;
        const end = start + params.pageSize - 1;
        query = query.range(start, end);
      }

      // 按创建时间倒序
      query = query.order('created_at', { ascending: false });

      // 执行查询
      const { data, error, count } = await query;
      
      if (error) {
        console.error('获取机构列表失败:', error);
        throw new Error(`获取机构列表失败: ${error.message}`);
      }

      return {
        data: data || [],
        totalCount: count || 0,
        page: params.page || 1,
        pageSize: params.pageSize || 10
      };
    } catch (error) {
      console.error('获取机构列表异常:', error);
      throw error;
    }
  }

  /**
   * 添加新机构
   * @param {Object} organizationData - 机构数据
   * @param {string} organizationData.name - 机构名称（必填）
   * @param {string} organizationData.type - 机构类型（必填，枚举值：university, government, school, other）
   * @param {string} organizationData.code - 机构代码（必填）
   * @param {string} organizationData.contact_person - 联系人
   * @param {string} organizationData.contact_phone - 联系电话
   * @param {string} organizationData.email - 电子邮箱
   * @param {string} organizationData.address - 地址
   * @param {string} organizationData.description - 描述
   * @param {string} createdBy - 创建者ID
   * @returns {Promise<Object>} 创建的机构数据
   */
  async addOrganization(organizationData, createdBy) {
    try {
      // 验证必填字段
      this.validateOrganizationData(organizationData);

      // 准备插入数据
      const insertData = {
        ...organizationData,
        created_by: createdBy || '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc', // 默认创建者ID
        created_at: new Date().toISOString()
      };

      console.log('准备添加机构数据:', insertData);

      // 执行插入
      const { data, error } = await supabase
        .from('organizations')
        .insert([insertData])
        .select();

      if (error) {
        console.error('添加机构失败:', error);
        // 处理常见错误
        if (error.code === '42501') {
          throw new Error('权限不足，请确保RLS策略已正确配置或临时禁用');
        } else if (error.code === '42P01') {
          throw new Error('表不存在，请先执行SQL脚本创建organizations表');
        } else if (error.code === '42703') {
          throw new Error('字段不存在，请检查表结构是否正确');
        }
        throw new Error(`添加机构失败: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('添加机构失败：未返回创建的机构数据');
      }

      console.log('成功添加机构:', data[0]);
      return data[0];
    } catch (error) {
      console.error('添加机构异常:', error);
      throw error;
    }
  }

  /**
   * 更新机构信息
   * @param {string} id - 机构ID
   * @param {Object} organizationData - 机构数据
   * @returns {Promise<Object>} 更新后的机构数据
   */
  async updateOrganization(id, organizationData) {
    try {
      if (!id) {
        throw new Error('机构ID不能为空');
      }

      // 移除不允许更新的字段
      const { created_at, created_by, ...updateData } = organizationData;
      
      // 添加更新时间
      updateData.updated_at = new Date().toISOString();

      console.log('准备更新机构数据 ID:', id, 'Data:', updateData);

      // 执行更新
      const { data, error } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) {
        console.error('更新机构失败:', error);
        throw new Error(`更新机构失败: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('更新失败：未找到该机构');
      }

      console.log('成功更新机构:', data[0]);
      return data[0];
    } catch (error) {
      console.error('更新机构异常:', error);
      throw error;
    }
  }

  /**
   * 删除机构
   * @param {string} id - 机构ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteOrganization(id) {
    try {
      if (!id) {
        throw new Error('机构ID不能为空');
      }

      console.log('准备删除机构 ID:', id);

      // 执行删除
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('删除机构失败:', error);
        throw new Error(`删除机构失败: ${error.message}`);
      }

      console.log('成功删除机构 ID:', id);
      return true;
    } catch (error) {
      console.error('删除机构异常:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取机构详情
   * @param {string} id - 机构ID
   * @returns {Promise<Object|null>} 机构详情或null
   */
  async getOrganizationById(id) {
    try {
      if (!id) {
        throw new Error('机构ID不能为空');
      }

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        // 如果是找不到记录的错误，返回null
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('获取机构详情失败:', error);
        throw new Error(`获取机构详情失败: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('获取机构详情异常:', error);
      throw error;
    }
  }

  /**
   * 获取机构类型统计
   * @returns {Promise<Object>} 各类型机构数量统计
   */
  async getOrganizationTypeStats() {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('type');

      if (error) {
        console.error('获取机构统计失败:', error);
        throw new Error(`获取机构统计失败: ${error.message}`);
      }

      // 计算各类型数量
      const stats = data.reduce((acc, org) => {
        acc[org.type] = (acc[org.type] || 0) + 1;
        return acc;
      }, {});

      return stats;
    } catch (error) {
      console.error('获取机构统计异常:', error);
      throw error;
    }
  }

  /**
   * 验证机构数据
   * @param {Object} data - 机构数据
   * @private
   */
  validateOrganizationData(data) {
    // 必填字段验证
    if (!data.name || data.name.trim() === '') {
      throw new Error('机构名称不能为空');
    }

    if (!data.type) {
      throw new Error('机构类型不能为空');
    }

    // 类型验证
    const validTypes = ['university', 'government', 'school', 'other'];
    if (!validTypes.includes(data.type)) {
      throw new Error(`无效的机构类型。有效类型: ${validTypes.join(', ')}`);
    }

    if (!data.code || data.code.trim() === '') {
      throw new Error('机构代码不能为空');
    }

    // 联系电话格式验证（简单验证）
    if (data.contact_phone && !/^\d{11}$/.test(data.contact_phone)) {
      throw new Error('联系电话格式不正确，应为11位数字');
    }

    // 邮箱格式验证（简单验证）
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error('邮箱格式不正确');
    }
  }

  /**
   * 批量添加测试机构数据
   * @param {number} count - 每种类型添加的数量
   * @returns {Promise<Object>} 添加结果统计
   */
  async batchAddTestOrganizations(count = 1) {
    try {
      const types = ['university', 'government', 'school'];
      let successCount = 0;
      const results = {};

      for (const type of types) {
        results[type] = [];
        for (let i = 1; i <= count; i++) {
          try {
            const testData = this.generateTestOrganizationData(type, i);
            const createdOrg = await this.addOrganization(testData);
            results[type].push(createdOrg);
            successCount++;
          } catch (error) {
            console.error(`添加测试${type}机构失败 #${i}:`, error.message);
          }
        }
      }

      return {
        successCount,
        totalCount: types.length * count,
        results
      };
    } catch (error) {
      console.error('批量添加测试机构异常:', error);
      throw error;
    }
  }

  /**
   * 生成测试机构数据
   * @param {string} type - 机构类型
   * @param {number} index - 索引
   * @returns {Object} 测试数据
   * @private
   */
  generateTestOrganizationData(type, index) {
    const typeNames = {
      university: '大学',
      government: '教育局',
      school: '学校',
      other: '其他机构'
    };

    return {
      name: `${typeNames[type] || '机构'}测试数据${index}_${Date.now()}`,
      type: type,
      code: `${type.toUpperCase()}${index}${Math.floor(Math.random() * 1000)}`,
      contact_person: `联系人${index}`,
      contact_phone: `13800138${Math.floor(Math.random() * 1000)}`,
      email: `${type}_test${index}@example.com`,
      address: `测试地址${index}`,
      description: `这是${typeNames[type] || '机构'}类型的测试数据，用于功能验证`
    };
  }

  /**
   * 初始化数据库表结构（如果不存在）
   * 注意：在实际生产环境中，应该使用数据库迁移工具
   * @returns {Promise<boolean>} 是否初始化成功
   */
  async initializeDatabase() {
    try {
      console.log('开始初始化organizations表...');
      
      // 由于直接执行DDL语句需要特殊权限，这里提供执行说明
      console.log('\n请在Supabase Dashboard中执行以下SQL来创建organizations表:');
      console.log('----------------------------------------------------------------------');
      console.log(`
-- 创建机构类型枚举
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_type') THEN
    CREATE TYPE organization_type AS ENUM ('university', 'government', 'school', 'other');
  END IF;
END$$;

-- 创建organizations表
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
    CREATE TABLE organizations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type organization_type NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      contact_person VARCHAR(100),
      contact_phone VARCHAR(20),
      email VARCHAR(100),
      address TEXT,
      description TEXT,
      created_by UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- 添加索引
    CREATE INDEX idx_organizations_name ON organizations(name);
    CREATE INDEX idx_organizations_type ON organizations(type);
    CREATE INDEX idx_organizations_code ON organizations(code);
    CREATE INDEX idx_organizations_created_at ON organizations(created_at);
    
    -- 禁用RLS以便测试
    ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
  END IF;
END$$;

-- 创建更新时间触发器函数
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_organizations_updated_at') THEN
    CREATE OR REPLACE FUNCTION update_organizations_updated_at()
    RETURNS TRIGGER AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$ LANGUAGE plpgsql;
  END IF;
END$$;

-- 创建触发器
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_organizations_updated_at') THEN
    CREATE TRIGGER trigger_update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_organizations_updated_at();
  END IF;
END$$;
      `);
      console.log('----------------------------------------------------------------------');
      
      console.log('\n执行完成后，organizations表将包含以下字段：');
      console.log('- id: 主键UUID');
      console.log('- name: 机构名称');
      console.log('- type: 机构类型（university/government/school/other）');
      console.log('- code: 机构代码（唯一）');
      console.log('- contact_person: 联系人');
      console.log('- contact_phone: 联系电话');
      console.log('- email: 电子邮箱');
      console.log('- address: 地址');
      console.log('- description: 描述');
      console.log('- created_by: 创建者ID');
      console.log('- created_at: 创建时间');
      console.log('- updated_at: 更新时间');
      
      return true;
    } catch (error) {
      console.error('初始化数据库异常:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const organizationService = new OrganizationService();

// 导出便捷方法
export const { 
  getOrganizations, 
  addOrganization, 
  updateOrganization, 
  deleteOrganization,
  getOrganizationById,
  getOrganizationTypeStats,
  batchAddTestOrganizations,
  initializeDatabase
} = organizationService;