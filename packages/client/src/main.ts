
import {createApp} from 'vue';
import {install as VueMonacoEditorPlugin} from '@guolao/vue-monaco-editor';
import {RecycleScroller} from 'vue-virtual-scroller';
import AppRoot from './AppRoot.vue';
import Btn from './widgets/btn.vue';
import CommitHash from './widgets/commit-hash.vue';
import CommitLink from './widgets/commit-link.vue';
import CommitMessage from './widgets/commit-message.vue';
import Draggable from 'vuedraggable';
import FilePath from './widgets/file-path.vue';
import FileStatus from './components/CommitDetails/FileStatus.vue';
import Icon from './widgets/icon.vue';
import Modal from './widgets/modal.vue';
import monaco_theme from './theme/monaco';
import Toggle from './widgets/toggle.vue';
import VueSplit from 'vue-split-panel';
import _ from './utils';
import * as monaco from 'monaco-editor';
import * as settings from './settings';
import './styles/global.scss';
import 'splitpanes/dist/splitpanes.css';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

window._ = _;
window.settings = settings;

const app = createApp(AppRoot);

app.component('Draggable', Draggable);
app.component('RecycleScroller', RecycleScroller);

app.component('Btn', Btn);
app.component('VueSplit', VueSplit);
app.component('CommitHash', CommitHash);
app.component('CommitLink', CommitLink);
app.component('CommitMessage', CommitMessage);
app.component('FilePath', FilePath);
app.component('FileStatus', FileStatus);
app.component('Icon', Icon);
app.component('Modal', Modal);
app.component('Toggle', Toggle);

for (const lang of ['css', 'scss', 'less']) {
	// https://github.com/atularen/ngx-monaco-editor/issues/61
	monaco.languages.css[`${lang}Defaults`].setOptions({validate: false});
}
monaco.editor.defineTheme('custom', monaco_theme);

app.use(VueMonacoEditorPlugin, {
	monaco
});

app.config.globalProperties.$_ = _;
app.config.globalProperties.$settings = settings;

app.mount('#app');
