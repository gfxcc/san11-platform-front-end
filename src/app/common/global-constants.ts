export class GlobalConstants {
    public static domain: string = 'san11pk';
    public static apiDomain: string = "https://api.san11pk.org";
    public static san11ServerUrl: string = GlobalConstants.apiDomain;
    public static fileServerUrl: string = 'https://storage.googleapis.com/san11-resources';

    public static maxBinarySize: number = 10 * 1024 * 1024 * 1024; // 10GB
    public static maxImageSize: number = 5 * 1024 * 1024; // 5MB

    public static tmpBucket = 'san11-tmp';
    public static resourceBucket = 'san11-resources';

    public static defaultUserImage: string = '../../../assets/images/zhuge.jpg';

    public static categories = [
        { value: '1', text: 'SIRE 插件', link: ['/categories', 1], icon: 'extension' },
        { value: '2', text: '修改工具', link: ['/categories', 2], icon: 'handyman' },
        { value: '3', text: 'MOD', link: ['/categories', 3], icon: 'auto_fix_high' },
    ];

    public static webModules = [
        { value: '11', text: '讨论区', link: ['/discussion'], icon: 'forum' },
        { value: '12', text: '专栏文章', link: ['/articles'], icon: 'sticky_note_2' },
        { value: '13', text: '留言板', link: ['/message-board'], icon: 'note_alt' },
    ]

    public static adminModules = [
        {
            value: '1', text: '管理员', link: ['/admin-message-board'], icon: 'admin_panel_settings',
        }
    ]
}