# EmailJS配置指南

本文档说明如何在Vercel上配置EmailJS环境变量，以便联系表单能够正常工作。

## 本地开发环境

在本地开发环境中，我们使用`.env.local`文件来存储EmailJS的配置信息。该文件已被添加到`.gitignore`中，不会被推送到Git仓库。

`.env.local`文件内容示例：

```
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_0aw****
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_vn7****
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=****wpSzR4Wiy****
```

## Vercel部署环境

在Vercel部署环境中，需要手动添加这些环境变量：

1. 登录Vercel账户
2. 进入项目设置
3. 点击"Environment Variables"选项卡
4. 添加以下环境变量：

| 变量名 | 值 |
|-------|-----|
| NEXT_PUBLIC_EMAILJS_SERVICE_ID | service_0awyadg |
| NEXT_PUBLIC_EMAILJS_TEMPLATE_ID | template_vn7scif |
| NEXT_PUBLIC_EMAILJS_PUBLIC_KEY | BvwywpSzR4WiypEws |

5. 点击"Save"保存设置
6. 重新部署项目，以使环境变量生效

## EmailJS模板配置

确保EmailJS模板中包含以下字段：

- `user_name`: 发送者姓名
- `user_email`: 发送者邮箱
- `subject`: 邮件主题
- `message`: 邮件内容
- `to_email`: 收件人邮箱（默认为1479333689@qq.com）

## 注意事项

- 环境变量以`NEXT_PUBLIC_`开头，这意味着它们会在构建时注入到前端代码中
- 虽然这些是公共密钥，但最好不要将它们直接提交到Git仓库中
- 如果需要更改EmailJS配置，请同时更新本地`.env.local`文件和Vercel环境变量 