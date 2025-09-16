import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { JwtInterceptor } from './jwt.interceptor';
import { provideNgIconsConfig, provideIcons } from '@ng-icons/core';
import { 
  heroHome, 
  heroBriefcase, 
  heroCog6Tooth, 
  heroUser, 
  heroMagnifyingGlass,
  heroPlay,
  heroFolder,
  heroDocument,
  heroPlus,
  heroArrowLeft,
  heroXMark,
  heroCheck,
  heroChevronDown,
  heroChevronUp,
  heroClock,
  heroBolt,
  heroComputerDesktop,
  heroUsers,
  heroChartBarSquare,
  heroArrowTrendingUp,
  heroEye,
  heroTrash,
  heroPencil,
  heroAdjustmentsHorizontal,
  heroBars3,
  heroXCircle,
  heroCheckCircle,
  heroExclamationTriangle,
  heroInformationCircle
} from '@ng-icons/heroicons/outline';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([JwtInterceptor])),
    provideNgIconsConfig({
      size: '1.5em',
      color: 'currentColor',
    }),
    provideIcons({
      heroHome,
      heroBriefcase,
      heroCog6Tooth,
      heroUser,
      heroMagnifyingGlass,
      heroPlay,
      heroFolder,
      heroDocument,
      heroChart: heroChartBarSquare,
      heroFilter: heroAdjustmentsHorizontal,
      heroPlus,
      heroArrowLeft,
      heroXMark,
      heroCheck,
      heroChevronDown,
      heroChevronUp,
      heroClock,
      heroBolt,
      heroComputerDesktop,
      heroUsers,
      heroChartBarSquare,
      heroArrowTrendingUp,
      heroEye,
      heroTrash,
      heroPencil,
      heroAdjustmentsHorizontal,
      heroBars3,
      heroXCircle,
      heroCheckCircle,
      heroExclamationTriangle,
      heroInformationCircle
    })
  ],
};
