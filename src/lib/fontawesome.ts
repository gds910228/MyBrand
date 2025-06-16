import { library } from '@fortawesome/fontawesome-svg-core';
import { 
  faHome, 
  faUser, 
  faBriefcase, 
  faNewspaper, 
  faEnvelope,
  faCode
} from '@fortawesome/free-solid-svg-icons';
import { 
  faGithub, 
  faLinkedin, 
  faTwitter 
} from '@fortawesome/free-brands-svg-icons';

// 添加要使用的图标到库中
library.add(
  // 实体图标
  faHome,
  faUser,
  faBriefcase,
  faNewspaper,
  faEnvelope,
  faCode,
  
  // 品牌图标
  faGithub,
  faLinkedin,
  faTwitter
);

// 导出这个配置，以便在_app.js中引入
export default library; 