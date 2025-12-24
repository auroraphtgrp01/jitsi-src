import React from "react";
import { connect } from "react-redux";

import { isMobileBrowser } from "../../base/environment/utils";
import { translate, translateToHTML } from "../../base/i18n/functions";
import Icon from "../../base/icons/components/Icon";
import { IconWarning } from "../../base/icons/svg";
import Watermarks from "../../base/react/components/web/Watermarks";
import getUnsafeRoomText from "../../base/util/getUnsafeRoomText.web";
import CalendarList from "../../calendar-sync/components/CalendarList.web";
import RecentList from "../../recent-list/components/RecentList.web";
import SettingsButton from "../../settings/components/web/SettingsButton";
import { SETTINGS_TABS } from "../../settings/constants";

import { AbstractWelcomePage, IProps, _mapStateToProps } from "./AbstractWelcomePage";
import Tabs from "./Tabs";

/**
 * The pattern used to validate room name.
 *
 * @type {string}
 */
export const ROOM_NAME_VALIDATE_PATTERN_STR = "^[^?&:\u0022\u0027%#]+$";

// Local declaration to satisfy type checking for this file.
// In the project this is provided globally via declaration files.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const interfaceConfig: any;

/**
 * The Web container rendering the welcome page.
 *
 * @augments AbstractWelcomePage
 */
class WelcomePage extends AbstractWelcomePage<IProps> {
    _additionalContentRef: HTMLDivElement | null;
    _additionalToolbarContentRef: HTMLDivElement | null;
    _additionalCardRef: HTMLDivElement | null;
    _roomInputRef: HTMLInputElement | null;
    _additionalCardTemplate: HTMLTemplateElement | null;
    _additionalContentTemplate: HTMLTemplateElement | null;
    _additionalToolbarContentTemplate: HTMLTemplateElement | null;
    _titleHasNotAllowCharacter: boolean;

    /**
     * Default values for {@code WelcomePage} component's properties.
     *
     * @static
     */
    static defaultProps = {
        _room: "",
    };

    /**
     * Initializes a new WelcomePage instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        this.state = {
            ...this.state,

            generateRoomNames: interfaceConfig.GENERATE_ROOMNAMES_ON_WELCOME_PAGE,
        };

        /**
         * Used To display a warning massage if the title input has no allow character.
         *
         * @private
         * @type {boolean}
         */
        this._titleHasNotAllowCharacter = false;

        /**
         * The HTML Element used as the container for additional content. Used
         * for directly appending the additional content template to the dom.
         *
         * @private
         * @type {HTMLTemplateElement|null}
         */
        this._additionalContentRef = null;

        this._roomInputRef = null;

        /**
         * The HTML Element used as the container for additional toolbar content. Used
         * for directly appending the additional content template to the dom.
         *
         * @private
         * @type {HTMLTemplateElement|null}
         */
        this._additionalToolbarContentRef = null;

        this._additionalCardRef = null;

        /**
         * The template to use as the additional card displayed near the main one.
         *
         * @private
         * @type {HTMLTemplateElement|null}
         */
        this._additionalCardTemplate = document.getElementById(
            "welcome-page-additional-card-template"
        ) as HTMLTemplateElement;

        /**
         * The template to use as the main content for the welcome page. If
         * not found then only the welcome page head will display.
         *
         * @private
         * @type {HTMLTemplateElement|null}
         */
        this._additionalContentTemplate = document.getElementById(
            "welcome-page-additional-content-template"
        ) as HTMLTemplateElement;

        /**
         * The template to use as the additional content for the welcome page header toolbar.
         * If not found then only the settings icon will be displayed.
         *
         * @private
         * @type {HTMLTemplateElement|null}
         */
        this._additionalToolbarContentTemplate = document.getElementById(
            "settings-toolbar-additional-content-template"
        ) as HTMLTemplateElement;

        // Bind event handlers so they are only bound once per instance.
        this._onFormSubmit = this._onFormSubmit.bind(this);
        this._onRoomChange = this._onRoomChange.bind(this);
        this._setAdditionalCardRef = this._setAdditionalCardRef.bind(this);
        this._setAdditionalContentRef = this._setAdditionalContentRef.bind(this);
        this._setRoomInputRef = this._setRoomInputRef.bind(this);
        this._setAdditionalToolbarContentRef = this._setAdditionalToolbarContentRef.bind(this);
        this._renderFooter = this._renderFooter.bind(this);
        this._onCreateMeetingClick = this._onCreateMeetingClick.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}. Invoked
     * immediately after this component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentDidMount() {
        super.componentDidMount();

        document.body.classList.add("welcome-page");
        document.title = interfaceConfig.APP_NAME;

        if (this.state.generateRoomNames) {
            this._updateRoomName();
        }

        if (this._shouldShowAdditionalContent()) {
            this._additionalContentRef?.appendChild(this._additionalContentTemplate?.content.cloneNode(true) as Node);
        }

        if (this._shouldShowAdditionalToolbarContent()) {
            this._additionalToolbarContentRef?.appendChild(
                this._additionalToolbarContentTemplate?.content.cloneNode(true) as Node
            );
        }

        if (this._shouldShowAdditionalCard()) {
            this._additionalCardRef?.appendChild(this._additionalCardTemplate?.content.cloneNode(true) as Node);
        }
    }

    /**
     * Removes the classname used for custom styling of the welcome page.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentWillUnmount() {
        super.componentWillUnmount();

        document.body.classList.remove("welcome-page");
    }

    /**
     * Warns users that only admin can create new meetings.
     *
     * @param {React.MouseEvent} event - The click event.
     * @private
     * @returns {void}
     */
    _onCreateMeetingClick(event: React.MouseEvent<HTMLButtonElement>) {
        event.preventDefault();
        window.alert("Chỉ admin mới có quyền tạo cuộc họp.");
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement|null}
     */
    override render() {
        const { _moderatedRoomServiceUrl, t } = this.props;
        const { DEFAULT_WELCOME_PAGE_LOGO_URL, DISPLAY_WELCOME_FOOTER } = interfaceConfig;
        const showAdditionalCard = this._shouldShowAdditionalCard();
        const showAdditionalContent = this._shouldShowAdditionalContent();
        const showAdditionalToolbarContent = this._shouldShowAdditionalToolbarContent();
        const contentClassName = showAdditionalContent ? "with-content" : "without-content";
        const footerClassName = DISPLAY_WELCOME_FOOTER ? "with-footer" : "without-footer";
        const placeholderText = "Nhập một mã hoặc liên kết cuộc họp";

        return (
            <>
                <style>{`
        .center-screen {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        /* Reset and base styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            background: #ffffff;
            color: #202124;
        }

        .container {
            max-width: 960px;
            margin: 0 auto;
            padding: 3rem 1.5rem 4rem;
        }

        /* Grid layout */
        .grid {
            display: grid;
            gap: 3rem;
            align-items: center;
            grid-template-columns: 1fr;
        }

        /* Left content */
        .left-content {
            display: flex;
            flex-direction: column;
            gap: 1.75rem;
            align-items: center;
            text-align: center;
        }

        .logo-container {
            display: none;
        }

        .heading {
            color: #202124;
            font-size: 44px;
            font-weight: 600;
            line-height: 1.2;
            margin-bottom: 0.5rem;
        }

        .subheading {
            font-size: 18px;
            color: #5f6368;
        }

        .hero-content h2 {
            display: none;
        }

        .hero-content p {
            display: none;
        }

        /* Buttons */
        .actions-row {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
        }

        .button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0 24px;
            height: 48px;
            font-size: 15px;
            border-radius: 24px;
            cursor: pointer;
            border: none;
            transition: box-shadow 150ms ease, transform 150ms ease;
            gap: 10px;
        }

        .button-primary {
            background: #1a73e8;
            color: #ffffff;
            box-shadow: 0 1px 3px rgba(26, 115, 232, 0.35);
        }

        .button-primary:hover {
            box-shadow: 0 2px 6px rgba(26, 115, 232, 0.4);
            transform: translateY(-1px);
        }

        .input-shell {
            display: inline-flex;
            align-items: center;
            height: 48px;
            padding: 0 14px;
            border: 1px solid #dadce0;
            border-radius: 24px;
            background: #ffffff;
            gap: 10px;
            min-width: 280px;
        }

        .input-shell input {
            border: none;
            outline: none;
            font-size: 15px;
            width: 100%;
            color: #202124;
        }

        .input-shell input::placeholder {
            color: #5f6368;
        }

        .link-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            color: #1a73e8;
            font-weight: 600;
            border: none;
            font-size: 15px;
            cursor: pointer;
            padding: 0 10px;
            height: 48px;
        }

        .inline-text {
            color: #5f6368;
            font-size: 14px;
            margin-top: 8px;
        }

        /* Right content removed */

        .divider {
            margin: 2rem 0;
            border: 0;
            border-top: 1px solid #dadce0;
        }

        .promo-card {
            max-width: 520px;
            margin: 0 auto;
            text-align: center;
            color: #202124;
        }

        .promo-logo {
            width: 80px;
            height: 80px;
            border-radius: 8px;
            background-image: url("https://hoclientuc.vn/assets/svg/logo_hoclientuc_notext.png");
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            margin: 0 auto 1rem;
        }

        .promo-title {
            font-size: 22px;
            font-weight: 500;
            margin-bottom: 0.5rem;
        }

        .promo-text {
            color: #5f6368;
            font-size: 14px;
            line-height: 1.6;
        }
    `}</style>
                <div className="center-screen">
                    <div className="container">
                        <div className="grid">
                            <div className="left-content">
                                <h1 className="heading">Tính năng họp và gọi video dành cho tất cả mọi người</h1>
                                <div className="subheading">Kết nối, cộng tác và ăn mừng ở bất cứ đâu với CME Meet</div>

                                <div className="actions-row">
                                    <button
                                        className="welcome-page-button button button-primary"
                                        onClick={this._onCreateMeetingClick}
                                        aria-disabled="false"
                                        aria-label="Bắt đầu cuộc họp mới"
                                        id="enter_room_button"
                                        tabIndex={0}
                                        type="button"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M23 7l-7 5 7 5V7z" />
                                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                        </svg>
                                        Cuộc họp mới
                                    </button>

                                    <form className="input-shell" onSubmit={this._onFormSubmit}>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M4 5h16" />
                                            <path d="M4 9h16" />
                                            <path d="M4 9h16" />
                                            <path d="M4 15h16" />
                                            <path d="M4 19h16" />
                                            <path d="M4 5h16" />
                                            <path d="M6 3v4" />
                                            <path d="M10 3v4" />
                                            <path d="M14 3v4" />
                                            <path d="M18 3v4" />
                                        </svg>
                                        <input
                                            ref={this._setRoomInputRef}
                                            placeholder={placeholderText}
                                            aria-label="Nhập mã hoặc liên kết cuộc họp"
                                            pattern={ROOM_NAME_VALIDATE_PATTERN_STR}
                                            required={false}
                                            onChange={this._onRoomChange}
                                        />
                                        <button type="submit" className="link-button" aria-label="Tham gia">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M5 12h14" />
                                                <path d="M13 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </form>
                                </div>

                                <div className="inline-text">Hoặc tham gia cuộc họp bằng mã</div>

                                <hr className="divider" />

                                <div className="promo-card">
                                    <div className="promo-logo" aria-hidden="true"></div>
                                    <div className="promo-title">Dùng thử các tính năng nâng cao của CME Meet</div>
                                    <div className="promo-text">
                                        Tận hưởng cuộc gọi dài hơn và nhiều lợi ích khác từ gói nâng cao. Bắt đầu dùng
                                        thử ngay hôm nay.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Slides removed per new design

    /**
     * Renders the insecure room name warning.
     *
     * @inheritdoc
     */
    override _doRenderInsecureRoomNameWarning() {
        return (
            <div className="insecure-room-name-warning">
                <Icon src={IconWarning} />
                <span>{getUnsafeRoomText(this.props.t, "welcome")}</span>
            </div>
        );
    }

    /**
     * Prevents submission of the form and delegates join logic.
     *
     * @param {Event} event - The HTML Event which details the form submission.
     * @private
     * @returns {void}
     */
    _onFormSubmit(event: React.FormEvent) {
        event.preventDefault();

        if (!this._roomInputRef || this._roomInputRef.reportValidity()) {
            this._onJoin();
        }
    }

    /**
     * Overrides the super to account for the differences in the argument types
     * provided by HTML and React Native text inputs.
     *
     * @inheritdoc
     * @override
     * @param {Event} event - The (HTML) Event which details the change such as
     * the EventTarget.
     * @protected
     */
    // @ts-ignore
    // eslint-disable-next-line require-jsdoc
    _onRoomChange(event: React.ChangeEvent<HTMLInputElement>) {
        const specialCharacters = ["?", "&", ":", "'", '"', "%", "#", "."];

        this._titleHasNotAllowCharacter = specialCharacters.some((char) => event.target.value.includes(char));
        super._onRoomChange(event.target.value);
    }

    /**
     * Renders the footer.
     *
     * @returns {ReactElement}
     */
    _renderFooter() {
        const {
            t,
            _deeplinkingCfg: {
                ios = { downloadLink: undefined },
                android = {
                    fDroidUrl: undefined,
                    downloadLink: undefined,
                },
            },
        } = this.props;

        const { downloadLink: iosDownloadLink } = ios;

        const { fDroidUrl, downloadLink: androidDownloadLink } = android;

        return (
            <footer className="welcome-footer">
                <div className="welcome-footer-centered">
                    <div className="welcome-footer-padded">
                        <div className="welcome-footer-row-block welcome-footer--row-1">
                            <div className="welcome-footer-row-1-text">{t("welcomepage.jitsiOnMobile")}</div>
                            <a
                                className="welcome-badge"
                                href={iosDownloadLink}
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                <img alt={t("welcomepage.mobileDownLoadLinkIos")} src="./images/app-store-badge.png" />
                            </a>
                            <a
                                className="welcome-badge"
                                href={androidDownloadLink}
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                <img
                                    alt={t("welcomepage.mobileDownLoadLinkAndroid")}
                                    src="./images/google-play-badge.png"
                                />
                            </a>
                            <a className="welcome-badge" href={fDroidUrl} rel="noopener noreferrer" target="_blank">
                                <img alt={t("welcomepage.mobileDownLoadLinkFDroid")} src="./images/f-droid-badge.png" />
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        );
    }

    /**
     * Renders tabs to show previous meetings and upcoming calendar events. The
     * tabs are purposefully hidden on mobile browsers.
     *
     * @returns {ReactElement|null}
     */
    _renderTabs() {
        if (isMobileBrowser()) {
            return null;
        }

        const { _calendarEnabled, _recentListEnabled, t } = this.props;

        const tabs: Array<{ id: string; label: string; content: React.ReactNode }> = [];

        if (_calendarEnabled) {
            tabs.push({
                id: "calendar",
                label: t("welcomepage.upcomingMeetings"),
                content: <CalendarList />,
            });
        }

        if (_recentListEnabled) {
            tabs.push({
                id: "recent",
                label: t("welcomepage.recentMeetings"),
                content: <RecentList />,
            });
        }

        if (tabs.length === 0) {
            return null;
        }

        return <Tabs accessibilityLabel={t("welcomepage.meetingsAccessibilityLabel")} tabs={tabs} />;
    }

    /**
     * Sets the internal reference to the HTMLDivElement used to hold the
     * additional card shown near the tabs card.
     *
     * @param {HTMLDivElement} el - The HTMLElement for the div that is the root
     * of the welcome page content.
     * @private
     * @returns {void}
     */
    _setAdditionalCardRef(el: HTMLDivElement) {
        this._additionalCardRef = el;
    }

    /**
     * Sets the internal reference to the HTMLDivElement used to hold the
     * welcome page content.
     *
     * @param {HTMLDivElement} el - The HTMLElement for the div that is the root
     * of the welcome page content.
     * @private
     * @returns {void}
     */
    _setAdditionalContentRef(el: HTMLDivElement) {
        this._additionalContentRef = el;
    }

    /**
     * Sets the internal reference to the HTMLDivElement used to hold the
     * toolbar additional content.
     *
     * @param {HTMLDivElement} el - The HTMLElement for the div that is the root
     * of the additional toolbar content.
     * @private
     * @returns {void}
     */
    _setAdditionalToolbarContentRef(el: HTMLDivElement) {
        this._additionalToolbarContentRef = el;
    }

    /**
     * Sets the internal reference to the HTMLInputElement used to hold the
     * welcome page input room element.
     *
     * @param {HTMLInputElement} el - The HTMLElement for the input of the room name on the welcome page.
     * @private
     * @returns {void}
     */
    _setRoomInputRef(el: HTMLInputElement) {
        this._roomInputRef = el;
    }

    /**
     * Returns whether or not an additional card should be displayed near the tabs.
     *
     * @private
     * @returns {boolean}
     */
    _shouldShowAdditionalCard() {
        return (
            interfaceConfig.DISPLAY_WELCOME_PAGE_ADDITIONAL_CARD &&
            this._additionalCardTemplate?.content &&
            this._additionalCardTemplate?.innerHTML?.trim()
        );
    }

    /**
     * Returns whether or not additional content should be displayed below
     * the welcome page's header for entering a room name.
     *
     * @private
     * @returns {boolean}
     */
    _shouldShowAdditionalContent() {
        return (
            interfaceConfig.DISPLAY_WELCOME_PAGE_CONTENT &&
            this._additionalContentTemplate?.content &&
            this._additionalContentTemplate?.innerHTML?.trim()
        );
    }

    /**
     * Returns whether or not additional content should be displayed inside
     * the header toolbar.
     *
     * @private
     * @returns {boolean}
     */
    _shouldShowAdditionalToolbarContent() {
        return (
            interfaceConfig.DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT &&
            this._additionalToolbarContentTemplate?.content &&
            this._additionalToolbarContentTemplate?.innerHTML.trim()
        );
    }
}

export default translate(connect(_mapStateToProps)(WelcomePage));
