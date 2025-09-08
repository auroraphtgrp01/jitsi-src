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
            background-color: #f7fafc; /* bg-gray-50 */
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem 1rem;
        }

        /* Grid layout */
        .grid {
            display: grid;
            gap: 3rem;
            align-items: center;
        }

        @media (min-width: 1024px) {
            .grid {
                grid-template-columns: 1fr 1fr;
            }
        }

        /* Left content */
        .left-content {
            display: flex;
            flex-direction: column;
            gap: 2rem;
        }

        .logo-container {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .logo {
            height: 4rem;
            width: auto;
        }


        .heading {
            color: #dc2626; /* text-red-600 */
            font-size: 36px;
            font-weight: 600;
            margin-bottom: 1rem;
        }

        .heading span {
            color: #2563eb; /* text-blue-600 */
        }

        .hero-content h2,
        .hero-content p {
            font-size: 56px;
            font-weight: 500;
            color: #111827; /* text-gray-900 */
            line-height: 1.2;
        }

        /* Optional: If you want <p> to be lighter color, uncomment below */
        /*
        .hero-content p {
            color: #4b5563; 
        }
        */

        /* Buttons */
        .action-buttons {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .button-container {
            position: relative;
        }

        .button {
            display: flex;
            align-items: center;
            padding: 1.5rem 2rem;
            font-size: 1.125rem;
            border-radius: 9999px;
            cursor: pointer;
            width: 100%;
            text-align: left;
            border: none;
        }

        .button-primary {
            background-color: #dc2626; /* bg-red-600 */
            color: white;
        }

        .button-primary:hover {
            background-color: #b91c1c; /* hover:bg-red-700 */
        }

        .button-outline {
            border: 1px solid #d1d5db; /* border-gray-300 */
            background-color: transparent;
            color: #4b5563; /* text-gray-600 */
        }

        .button-ghost {
            background-color: transparent;
            color: #4b5563; /* text-gray-600 */
        }

        .button-ghost:hover {
            background-color: #f3f4f6; /* hover:bg-gray-100 */
        }

        .button-icon {
            margin-right: 0.75rem;
            font-size: 1.25rem;
            padding: 4px;
        }

        .sign-in-text {
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: #fecaca; /* text-red-200 */
            font-size: 0.875rem;
        }

        /* Right content */
        .right-content {
            text-align: right;
        }

        .right-content h3 {
            font-size: 36px;
            font-weight: 600;
            text-align: center;
            margin-bottom: 1.5rem;
        }

        .right-content h3 span.red {
            color: #dc2626; /* text-red-600 */
        }

        .right-content h3 span.blue {
            color: #2563eb; /* text-blue-600 */
        }

        /* Card */
        .card {
            background-color: white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            overflow: hidden;
        }

        .card img {
            width: 100%;
            height: auto;
        }

        .features-text {
            text-align: center;
            color: rgba(185, 185, 185, 1);
            margin-top: 1rem;
            font-size: 18px;
        }

        /* Navigation */
        .navigation {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            margin-top: 1rem;
            
        }

        .nav-button {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 2rem;
            height: 2rem;
            background-color: #dc2626;
            border: none;
            cursor: pointer;
        }

        .dots {
            display: flex;
            gap: 0.5rem;
        }

        .dot {
            width: 0.5rem;
            height: 0.5rem;
            border-radius: 9999px;
        }

        .dot-active {
            background-color: #dc2626; /* bg-red-600 */
        }

        .dot-inactive {
            background-color: #d1d5db; /* bg-gray-300 */
        }
    `}</style>
                <div className="center-screen">
                    <div className="container">
                        <div className="grid">
                            <div className="left-content">
                                <div className="logo-container">
                                    <img src="./images/duytan-logo.png" alt="DuyTan University Logo" className="logo" />
                                </div>
                                <div>
                                    <h1 className="heading">
                                        Meet <span>DuyTan University</span>
                                    </h1>
                                </div>
                                <div className="hero-content">
                                    <h2>Hop on a call with everyone, anytime</h2>
                                    <span style={{ fontSize: "24px", color: "#6b7280" }}>
                                        Video calls and meeting for everyone
                                    </span>
                                </div>
                                <div className="action-buttons">
                                    <div className="button-container">
                                        <button
                                            className="welcome-page-button button button-primary"
                                            onClick={this._onFormSubmit}
                                            aria-disabled="false"
                                            aria-label="Start meeting"
                                            id="enter_room_button"
                                            tabIndex={0}
                                            type="button"
                                        >
                                            <span
                                                className="button-icon"
                                                style={{ borderRadius: "2px", backgroundColor: "white" }}
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="24"
                                                    height="24"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    stroke-width="2"
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    className="lucide lucide-plus-icon lucide-plus"
                                                    style={{ color: "black" }}
                                                >
                                                    <path d="M5 12h14" />
                                                    <path d="M12 5v14" />
                                                </svg>
                                            </span>
                                            {t("welcomepage.startMeeting")}
                                        </button>
                                        <span className="sign-in-text">Sign In Required</span>
                                    </div>
                                    <button className="button button-outline">
                                        <span
                                            className="button-icon"
                                            style={{ borderRadius: "2px", backgroundColor: "rgba(243, 244, 246, 1)" }}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="2"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                className="lucide lucide-users-icon lucide-users"
                                                style={{ color: "rgba(23, 23, 23, 1)" }}
                                            >
                                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                                <path d="M16 3.128a4 4 0 0 1 0 7.744" />
                                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                                <circle cx="9" cy="7" r="4" />
                                            </svg>
                                        </span>
                                        Join Meeting
                                    </button>
                                    <button className="button button-outline">
                                        <span
                                            className="button-icon"
                                            style={{ borderRadius: "2px", backgroundColor: "rgba(243, 244, 246, 1)" }}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="2"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                className="lucide lucide-log-out-icon lucide-log-out"
                                            >
                                                <path d="m16 17 5-5-5-5" />
                                                <path d="M21 12H9" />
                                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                            </svg>
                                        </span>
                                        Sign In
                                    </button>
                                </div>
                            </div>
                            <div className="right-content">
                                <div>
                                    <h3>
                                        Meet <span className="red">DuyTan</span>{" "}
                                        <span className="blue">University</span>
                                    </h3>
                                </div>
                                <div className="card">
                                    <img src="./images/detailed-video-interface.png" alt="Video call interface" />
                                </div>
                                <div className="features-text">Features that make it super easy to meet online!</div>
                                <div className="navigation">
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "4rem",
                                            border: "1px solid rgb(229, 231, 235)",
                                            padding: "8px 24px",
                                            borderRadius: "18px",
                                        }}
                                    >
                                        <button className="nav-button">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="2"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                className="lucide lucide-chevron-left-icon lucide-chevron-left"
                                            >
                                                <path d="m15 18-6-6 6-6" />
                                            </svg>
                                        </button>
                                        <div className="dots">
                                            <div className="dot dot-active"></div>
                                            <div className="dot dot-inactive"></div>
                                            <div className="dot dot-inactive"></div>
                                        </div>
                                        <button className="nav-button">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="2"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                className="lucide lucide-chevron-right-icon lucide-chevron-right"
                                            >
                                                <path d="m9 18 6-6-6-6" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

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

        const tabs = [];

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
