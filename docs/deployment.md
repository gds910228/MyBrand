# 部署方案与步骤

## 部署平台对比

| 平台 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- |
| **Vercel** | - Next.js原生支持<br>- 零配置部署<br>- 自动HTTPS<br>- 全球CDN<br>- 预览部署<br>- 免费套餐足够个人使用 | - 高级功能收费<br>- 自定义服务器功能受限 | - 个人项目<br>- 快速部署<br>- 需要预览功能 |
| **Netlify** | - 简单易用<br>- 自动HTTPS<br>- 全球CDN<br>- 预览部署<br>- 表单处理<br>- 免费套餐慷慨 | - Next.js某些高级功能需要适配<br>- 自定义服务器功能受限 | - 静态网站<br>- 需要表单功能<br>- JAMstack应用 |
| **AWS Amplify** | - 与AWS生态集成<br>- 全栈解决方案<br>- 强大的CI/CD | - 配置复杂<br>- 学习曲线陡峭<br>- 成本可能较高 | - 企业应用<br>- 需要AWS其他服务<br>- 全栈应用 |
| **自托管** | - 完全控制<br>- 可自定义所有方面<br>- 长期成本可能更低 | - 需要服务器管理经验<br>- 需要自行配置CI/CD<br>- 需要自行处理SSL、CDN等 | - 需要完全控制<br>- 有DevOps经验<br>- 特殊合规要求 |

## 选择理由

基于项目需求和资源情况，我们选择 **Vercel** 作为部署平台，原因如下：

1. **原生支持Next.js** - 由Next.js团队开发，提供最佳兼容性
2. **零配置部署** - 直接从Git仓库部署，无需复杂配置
3. **自动预览** - 每次PR自动生成预览链接，便于团队协作
4. **全球CDN** - 确保全球用户访问速度
5. **免费套餐足够** - 个人项目使用免费套餐完全足够

## 部署步骤

### 1. 准备工作

- 确保项目代码已提交到GitHub/GitLab/Bitbucket
- 确保项目根目录包含`package.json`文件，且包含以下脚本:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

### 2. Vercel部署流程

1. 注册/登录[Vercel](https://vercel.com)账户
2. 点击"New Project"按钮
3. 导入你的Git仓库
4. 配置项目:
   - **Framework Preset**: 选择"Next.js"
   - **Build Command**: 默认使用`next build`
   - **Output Directory**: 默认使用`.next`
   - **Environment Variables**: 添加所有必要的环境变量
     - `NOTION_API_KEY`
     - `NOTION_PROJECTS_DATABASE_ID`
     - `NOTION_BLOG_DATABASE_ID`
     - `NOTION_ABOUT_PAGE_ID`
     - `NEXT_PUBLIC_SITE_URL`
     - `NEXT_PUBLIC_SITE_NAME`
     - `NEXT_PUBLIC_SITE_DESCRIPTION`
5. 点击"Deploy"按钮

### 3. 域名设置

1. 在Vercel项目设置中，进入"Domains"标签页
2. 添加自定义域名
3. 根据Vercel提供的指导，在域名注册商处添加DNS记录:
   - 如使用Vercel DNS: 修改域名的nameservers
   - 如使用外部DNS: 添加A记录或CNAME记录

### 4. 持续集成/持续部署

Vercel会自动为你设置CI/CD流程:

- 每次推送到主分支会自动部署到生产环境
- 每次创建PR会生成预览URL
- 可在项目设置中自定义部署行为

### 5. 监控与分析

1. 在Vercel仪表盘中查看部署状态和性能指标
2. 配置Vercel Analytics以跟踪网站性能和用户行为
3. 设置警报以便在部署失败或性能问题时收到通知

## 部署后检查清单

- [ ] 确认所有页面正常加载
- [ ] 测试Notion API连接是否正常工作
- [ ] 检查响应式设计在各种设备上的表现
- [ ] 验证表单和交互功能
- [ ] 检查SSL证书是否正确配置
- [ ] 测试自定义域名是否正常工作
- [ ] 确认环境变量是否正确设置
- [ ] 测试网站性能和加载速度 