import { NextResponse } from 'next/server';

// 配置此路由不受中间件限制
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
    
    console.log('EmailJS环境变量:', {
      serviceId,
      templateId,
      publicKey: publicKey ? '已设置' : '未设置'
    });
    
    if (!serviceId || !templateId || !publicKey) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少EmailJS配置',
        config: {
          serviceId: serviceId || '未设置',
          templateId: templateId || '未设置',
          publicKey: publicKey ? '已设置' : '未设置'
        }
      }, { status: 500 });
    }
    
    // 使用REST API直接发送邮件
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          user_name: '测试用户',
          user_email: 'test@example.com',
          subject: '测试邮件',
          message: '这是一封通过API路由发送的测试邮件',
          to_email: '1479333689@qq.com'
        }
      })
    });
    
    if (response.ok) {
      return NextResponse.json({ 
        success: true, 
        message: '邮件发送成功',
        status: response.status,
        statusText: response.statusText
      });
    } else {
      const errorText = await response.text();
      return NextResponse.json({ 
        success: false, 
        error: '邮件发送失败',
        status: response.status,
        statusText: response.statusText,
        errorText
      }, { status: response.status });
    }
  } catch (error: any) {
    console.error('测试邮件发送失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || '未知错误'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.json();
    console.log('收到表单数据:', formData);
    
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
    
    if (!serviceId || !templateId || !publicKey) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少EmailJS配置'
      }, { status: 500 });
    }
    
    // 使用REST API直接发送邮件
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          user_name: formData.name || '未提供姓名',
          user_email: formData.email || '未提供邮箱',
          subject: formData.subject || '未提供主题',
          message: formData.message || '未提供内容',
          to_email: formData.to_email || '1479333689@qq.com'
        }
      })
    });
    
    if (response.ok) {
      return NextResponse.json({ 
        success: true, 
        message: '邮件发送成功',
        status: response.status,
        statusText: response.statusText
      });
    } else {
      const errorText = await response.text();
      return NextResponse.json({ 
        success: false, 
        error: '邮件发送失败',
        status: response.status,
        statusText: response.statusText,
        errorText
      }, { status: response.status });
    }
  } catch (error: any) {
    console.error('表单提交失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || '未知错误'
    }, { status: 500 });
  }
} 