// @flow
import { Component } from 'react';
import type { Node, ComponentType } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react';
import { intlShape } from 'react-intl';
import type { InjectedOrGenerated } from '../../types/injectedPropsType';
import TopBarLayout from '../../components/layout/TopBarLayout';
import BannerContainer from '../banners/BannerContainer';
import type { GeneratedData as BannerContainerData } from '../banners/BannerContainer';
import SidebarContainer from '../SidebarContainer';
import BackgroundColoredLayout from '../../components/layout/BackgroundColoredLayout';
import NoWalletMessage from '../wallet/NoWalletMessage';
import UnsupportedWallet from '../wallet/UnsupportedWallet';
import NavBarTitle from '../../components/topbar/NavBarTitle';
import NavBarContainer from '../NavBarContainer';
import globalMessages from '../../i18n/global-messages';
import WalletTransferPage from './WalletTransferPage';
import type { GeneratedData as WalletTransferPageData } from './WalletTransferPage';
import type { GeneratedData as SidebarContainerData } from '../SidebarContainer';
import type { GeneratedData as NavBarContainerData } from '../NavBarContainer';
import type { $npm$ReactIntl$IntlFormat } from 'react-intl';
import { PublicDeriver } from '../../api/ada/lib/storage/models/PublicDeriver/index';
import { CoinTypes } from '../../config/numbersConfig';
import HorizontalLine from '../../components/widgets/HorizontalLine';
import NavBarContainerRevamp from '../NavBarContainerRevamp';
import { withLayout } from '../../styles/context/layout';
import type { LayoutComponentMap } from '../../styles/context/layout';
import type { GeneratedData as NavBarContainerRevampData } from '../NavBarContainerRevamp';
import SubMenu from '../../components/topbar/SubMenu';
import { allSubcategoriesRevamp } from '../../stores/stateless/topbarCategories';

export type GeneratedData = typeof Transfer.prototype.generated;

type Props = {|
  ...InjectedOrGenerated<GeneratedData>,
  +children?: Node,
|};

type InjectedProps = {| +renderLayoutComponent: LayoutComponentMap => Node |};
type AllProps = {| ...Props, ...InjectedProps |};

@observer
class Transfer extends Component<AllProps> {
  static contextTypes: {| intl: $npm$ReactIntl$IntlFormat |} = {
    intl: intlShape.isRequired,
  };

  static defaultProps: {| children: void |} = {
    children: undefined,
  };

  render(): Node {
    const sidebarContainer = <SidebarContainer {...this.generated.SidebarContainerProps} />;

    const menu = (
      <SubMenu
        options={allSubcategoriesRevamp.map(category => ({
          className: category.className,
          label: this.context.intl.formatMessage(category.label),
          route: category.route,
        }))}
        onItemClick={route => this.generated.actions.router.goToRoute.trigger({ route })}
        isActiveItem={route => this.generated.stores.app.currentRoute.startsWith(route)}
      />
    );
    const navbarClassic = (
      <NavBarContainer
        {...this.generated.NavBarContainerProps}
        title={
          <NavBarTitle title={this.context.intl.formatMessage(globalMessages.sidebarTransfer)} />
        }
      />
    );

    const navbarRevamp = (
      <NavBarContainerRevamp
        {...this.generated.NavBarContainerRevampProps}
        title={
          <NavBarTitle title={this.context.intl.formatMessage(globalMessages.sidebarSettings)} />
        }
        menu={menu}
      />
    );

    const navbar = this.props.renderLayoutComponent({
      CLASSIC: navbarClassic,
      REVAMP: navbarRevamp,
    });

    return (
      <TopBarLayout
        banner={<BannerContainer {...this.generated.BannerContainerProps} />}
        navbar={navbar}
        sidebar={sidebarContainer}
        showInContainer
      >
        {this.getContent()}
      </TopBarLayout>
    );
  }

  getContent: void => Node = () => {
    const wallet = this.generated.stores.wallets.selected;
    if (wallet == null) {
      return (<NoWalletMessage />);
    }
    // temporary solution: will need to handle more cases later for different currencies
    if (wallet.getParent().getNetworkInfo().CoinType !== CoinTypes.CARDANO) {
      return (<UnsupportedWallet />);
    }
    return (
      <>
        <HorizontalLine />
        <BackgroundColoredLayout>
          <WalletTransferPage
            {...this.generated.WalletTransferPageProps}
            publicDeriver={wallet}
          />
        </BackgroundColoredLayout>
      </>
    );
  }

  @computed get generated(): {|
    BannerContainerProps: InjectedOrGenerated<BannerContainerData>,
    NavBarContainerProps: InjectedOrGenerated<NavBarContainerData>,
    NavBarContainerRevampProps: InjectedOrGenerated<NavBarContainerRevampData>,
    SidebarContainerProps: InjectedOrGenerated<SidebarContainerData>,
    WalletTransferPageProps: InjectedOrGenerated<WalletTransferPageData>,
    actions: {|
      router: {|
        goToRoute: {|
          trigger: (params: {|
            publicDeriver?: null | PublicDeriver<>,
            params?: ?any,
            route: string
          |}) => void
        |}
      |}
    |},
    stores: {|
      app: {| currentRoute: string |},
      wallets: {| selected: null | PublicDeriver<> |}
    |}
    |} {
    if (this.props.generated !== undefined) {
      return this.props.generated;
    }
    if (this.props.stores == null || this.props.actions == null) {
      throw new Error(`${nameof(Transfer)} no way to generated props`);
    }
    const { stores, actions } = this.props;
    return Object.freeze({
      stores: {
        app: {
          currentRoute: stores.app.currentRoute,
        },
        wallets: {
          selected: stores.wallets.selected,
        }
      },
      actions: {
        router: {
          goToRoute: { trigger: actions.router.goToRoute.trigger },
        },
      },
      SidebarContainerProps: (
        { actions, stores, }: InjectedOrGenerated<SidebarContainerData>
      ),
      NavBarContainerProps: (
        { actions, stores, }: InjectedOrGenerated<NavBarContainerData>
      ),
      NavBarContainerRevampProps: (
        { actions, stores, }: InjectedOrGenerated<NavBarContainerRevampData>
      ),
      WalletTransferPageProps: (
        { actions, stores, }: InjectedOrGenerated<WalletTransferPageData>
      ),
      BannerContainerProps: ({ actions, stores }: InjectedOrGenerated<BannerContainerData>),
    });
  }
}
export default (withLayout(Transfer): ComponentType<Props>)