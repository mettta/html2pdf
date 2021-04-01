const text = `
<h3>Test for printing</h3>
  <div id="printTHIS">

  <template id="printTHISfrontpage">
    <h1>frontpage</h1>
    <h1>frontpage</h1>
    <h1>frontpage</h1>
    <h1>frontpage</h1>
    <h1>frontpage</h1>
    <h1>frontpage</h1>
    <h1>frontpage</h1>
    <h1>frontpage</h1>
    <h1>frontpage</h1>
    <h1>frontpage</h1>
    <h1>frontpage</h1>
    <h1>frontpage</h1>
    <h1>frontpage</h1>
    <h1>frontpage</h1>
    <h1>frontpage</h1>
    <h1>frontpage</h1>
    <h1>frontpage</h1>
    <h1>frontpage</h1>
    <h1>frontpage</h1>
    <h1>frontpage</h1>
    <h1>frontpage</h1>
    <h1>frontpage</h1>
    <h1>frontpage</h1>
  </template>

  <template id="printTHISheader">
    <div data-page-number-root>
      <span data-page-number-current></span>
      of
      <span data-page-number-total></span>
    </div>
    <p>header</p>
  </template>

  <template id="printTHISfooter">
    <p>footer</p>
  </template>

<h3>Table of content</h3>

<ul>
  <li>Nostrud nulla sunt labore officia laborum quis laboris nisi enim.</li>
  <li>Exercitation irure aliquip magna reprehenderit non aliquip nulla ex cupidatat.</li>
  <li>Anim consequat fugiat occaecat culpa sunt qui quis minim ullamco dolore ex cupidatat.</li>
  <li>Veniam sit cillum qui officia pariatur.<ul>
    <li>Dolore in nostrud ex qui Lorem velit duis sunt.</li>
    <li>Ipsum elit sunt excepteur veniam eu.</li>
    <li>Proident id pariatur minim non ullamco nisi exercitation commodo do anim sint.</li>
    <li>Commodo nisi sunt pariatur ad commodo.</li>
    <li>Excepteur velit consectetur esse anim.</li>
    <li>Quis et aliquip non mollit do.</li>
    <li>Aliquip esse deserunt reprehenderit duis voluptate.<ul>
      <li>Dolor dolor cillum pariatur deserunt ut laboris minim do culpa.</li>
      <li>Enim est nulla sint cupidatat.</li>
      <li>Id velit amet eiusmod ad esse elit dolor amet labore aliqua pariatur ex.</li>
      <li>Ipsum tempor ullamco eiusmod ea fugiat ipsum aliquip Lorem nisi qui eiusmod enim aute do.</li>
      <li>Duis ullamco incididunt proident nostrud laborum ut culpa dolor laborum excepteur enim.</li>
      <li>Dolore id eiusmod sunt consectetur esse reprehenderit.</li>
    </ul></li>
    <li>Duis ut cillum et excepteur quis cupidatat do duis nulla non.</li>
    <li>Ut esse incididunt dolore cillum id qui cupidatat non irure et aliqua ut ut in.</li>
    <li>Commodo sint Lorem reprehenderit exercitation labore.</li>
    <li>Eiusmod laboris labore reprehenderit enim.</li>
    <li>Pariatur duis cillum ut esse ipsum aliqua consequat adipisicing amet fugiat.</li>
    <li>Labore in dolore laborum aliqua.</li>
    <li>Elit ullamco ea exercitation et ullamco reprehenderit est ullamco eu enim dolor.</li>
  </ul></li>
  <li>Nisi laboris do Lorem laborum deserunt.</li>
  <li>Duis Lorem ipsum reprehenderit minim eiusmod dolore exercitation culpa velit labore ad.</li>
  <li>Et ea ex anim cillum ipsum.</li>
  <li>Ea incididunt fugiat aliquip consectetur labore sit nostrud deserunt nisi veniam aliquip.<ul>
    <li>Nisi ullamco qui nulla sint pariatur proident eiusmod nulla voluptate.</li>
    <li>Pariatur sit aliquip consequat ex consequat magna id ut reprehenderit.</li>
    <li>Amet ex consectetur amet occaecat sunt consectetur adipisicing ut eu commodo.</li>
    <li>Eiusmod reprehenderit ex id quis irure deserunt.</li>
    <li>Amet cupidatat et officia do et officia.</li>
    <li>Minim amet aute sit eu enim aliquip.</li>
    <li>Nisi culpa eu labore ea dolor tempor excepteur est esse elit qui.</li>
  </ul></li>
  <li>Est in labore commodo ipsum.</li>
  <li>Lorem in adipisicing sit enim consectetur enim enim duis consectetur.</li>
  <li>Quis ad incididunt consectetur aliquip adipisicing laborum magna.</li>
  <li>Commodo eiusmod magna occaecat excepteur irure voluptate qui do.</li>
  <li>Nostrud nulla sunt labore officia laborum quis laboris nisi enim.</li>
  <li>Exercitation irure aliquip magna reprehenderit non aliquip nulla ex cupidatat.</li>
  <li>Anim consequat fugiat occaecat culpa sunt qui quis minim ullamco dolore ex cupidatat.</li>
  <li>Veniam sit cillum qui officia pariatur.<ul>
    <li>Dolore in nostrud ex qui Lorem velit duis sunt.</li>
    <li>Ipsum elit sunt excepteur veniam eu.</li>
    <li>Proident id pariatur minim non ullamco nisi exercitation commodo do anim sint.</li>
    <li>Commodo nisi sunt pariatur ad commodo.</li>
    <li>Excepteur velit consectetur esse anim.</li>
    <li>Quis et aliquip non mollit do.</li>
    <li>Aliquip esse deserunt reprehenderit duis voluptate.<ul>
      <li>Dolor dolor cillum pariatur deserunt ut laboris minim do culpa.</li>
      <li>Enim est nulla sint cupidatat.</li>
      <li>Id velit amet eiusmod ad esse elit dolor amet labore aliqua pariatur ex.</li>
      <li>Ipsum tempor ullamco eiusmod ea fugiat ipsum aliquip Lorem nisi qui eiusmod enim aute do.</li>
      <li>Duis ullamco incididunt proident nostrud laborum ut culpa dolor laborum excepteur enim.</li>
    </ul></li>
  </ul></li>


</ul>
<div data-print-forced-page-break></div>

<H1>Et incididunt eiusmod pariatur consectetur duis.</H1>
<P>Culpa aliquip cupidatat fugiat sit consequat voluptate aliquip pariatur labore eiusmod sunt. Esse dolor tempor minim exercitation occaecat laboris aliqua mollit duis ea. Proident do duis minim sit officia duis occaecat.</P>
<P>Tempor nisi duis non deserunt. Consequat anim in quis consequat id ipsum mollit qui ipsum adipisicing fugiat Lorem adipisicing officia. Do quis pariatur enim eiusmod. Ut nulla amet duis laborum veniam qui ex. Non enim Lorem fugiat Lorem incididunt ex proident dolor tempor magna ea. Consequat consequat labore proident eiusmod laborum qui nostrud consequat velit magna commodo. Tempor esse sint ex cillum.</P>
<P>Ipsum amet adipisicing ipsum enim magna labore. Do sit mollit cupidatat cupidatat elit consequat. Sunt quis quis do laboris esse amet nostrud sint consectetur ad ipsum occaecat. Ex cillum deserunt in commodo consectetur nisi.</P>

<H2>Occaecat Lorem dolore veniam ullamco ipsum sit nostrud consectetur.</H2>
<P>Id do labore dolor magna veniam. Fugiat velit tempor velit id officia non reprehenderit culpa. Sint dolore ea dolor labore velit ex reprehenderit nisi minim sit aliqua cupidatat voluptate nulla.</P>

<H3>Incididunt consequat anim ea qui aute et fugiat eu aute in ullamco ad.</H3>
<P>Aute cupidatat enim nulla occaecat fugiat ad magna id anim. Consequat irure ea reprehenderit incididunt anim consequat. Dolore voluptate culpa duis irure deserunt. Ex et ut commodo non incididunt. Laborum aute quis esse ad fugiat tempor minim est ut est.</P>

<H3>Velit laborum ea tempor id dolore Lorem dolor pariatur ex.</H3>
<P>Mollit consectetur occaecat sint ut sit velit duis cupidatat ex proident. Ea anim occaecat reprehenderit culpa labore ipsum. Ipsum anim reprehenderit velit nisi excepteur incididunt. Tempor occaecat incididunt tempor dolor officia nostrud anim irure officia reprehenderit cupidatat in occaecat. Laborum eiusmod excepteur velit ex veniam et consequat anim minim ea ex ipsum aliquip. Fugiat non irure et tempor reprehenderit ullamco excepteur sit. Nisi quis commodo aliqua dolor ex consequat consectetur Lorem ipsum deserunt quis esse minim.</P>

<H3>Fugiat adipisicing cillum nostrud deserunt cillum.</H3>
<P>Reprehenderit culpa tempor enim excepteur. Deserunt tempor velit sunt pariatur cupidatat. Ullamco anim voluptate proident excepteur consequat ea dolor ipsum dolor nulla esse. Eiusmod magna qui nostrud consectetur cillum proident dolor exercitation ut cupidatat magna. Sunt do mollit veniam aute exercitation duis non nisi dolor ea ad eu ut amet. Consectetur nulla sunt ipsum aliqua pariatur tempor laborum aliquip id ipsum nostrud. Eu excepteur commodo veniam velit duis eu.</P>

<H3>Labore enim tempor ad laboris esse dolor labore irure.</H3>
<P>Commodo anim cillum proident esse duis. Consequat commodo commodo eu cillum mollit ea anim. Ullamco irure elit eiusmod sunt est aliqua laboris ea reprehenderit dolore. Elit culpa laborum reprehenderit voluptate officia in sunt ut mollit duis. Nostrud laboris magna fugiat aute labore est dolore ullamco irure voluptate nostrud ipsum. Velit consequat minim exercitation veniam sit ipsum.</P>

<H2>Sunt irure pariatur ad labore veniam exercitation excepteur est id enim in id velit.</H2>
<H3>Id elit esse exercitation officia nisi reprehenderit ut nisi in elit aute consectetur commodo est.</H3>
<P>Minim duis est laboris est excepteur irure pariatur deserunt. Aliqua ipsum culpa est laboris cupidatat duis labore excepteur laborum. Et minim proident exercitation incididunt deserunt magna ullamco sit excepteur.</P>
<P>Labore do ad in in velit aute laborum aute fugiat duis fugiat consectetur. Nulla aliquip Lorem adipisicing fugiat non labore nisi id sit Lorem occaecat pariatur veniam duis. Commodo id adipisicing incididunt anim qui anim sunt.</P>
<P>Veniam adipisicing incididunt ipsum consequat duis. Eiusmod excepteur magna velit qui ex ad laboris cillum consectetur in. Eiusmod sunt qui aute ipsum esse eiusmod. Ad velit veniam veniam est anim deserunt pariatur ea minim sit sunt adipisicing duis consequat. Lorem magna est est adipisicing in fugiat irure velit cillum laborum occaecat aute. Proident deserunt pariatur magna sunt consectetur.</P>
<P>Amet eu ex aliqua esse aliquip incididunt minim velit amet nulla sint. Eiusmod elit minim ex proident non. Eu nulla quis sunt nostrud ea ea. Excepteur pariatur ea ipsum nulla laborum id eiusmod sint mollit minim amet. In laborum aute irure nulla ad ea veniam quis mollit veniam. Ad veniam sit cupidatat elit ipsum cupidatat nostrud exercitation fugiat Lorem et.</P>

<H2>Occaecat Lorem dolore veniam ullamco ipsum sit nostrud consectetur.</H2>
<P>Id do labore dolor magna veniam. Fugiat velit tempor velit id officia non reprehenderit culpa. Sint dolore ea dolor labore velit ex reprehenderit nisi minim sit aliqua cupidatat voluptate nulla.</P>

<H3>Incididunt consequat anim ea qui aute et fugiat eu aute in ullamco ad.</H3>
<P>Aute cupidatat enim nulla occaecat fugiat ad magna id anim. Consequat irure ea reprehenderit incididunt anim consequat. Dolore voluptate culpa duis irure deserunt. Ex et ut commodo non incididunt. Laborum aute quis esse ad fugiat tempor minim est ut est.</P>

<H3>Velit laborum ea tempor id dolore Lorem dolor pariatur ex.</H3>
<P>Mollit consectetur occaecat sint ut sit velit duis cupidatat ex proident. Ea anim occaecat reprehenderit culpa labore ipsum. Ipsum anim reprehenderit velit nisi excepteur incididunt. Tempor occaecat incididunt tempor dolor officia nostrud anim irure officia reprehenderit cupidatat in occaecat. Laborum eiusmod excepteur velit ex veniam et consequat anim minim ea ex ipsum aliquip. Fugiat non irure et tempor reprehenderit ullamco excepteur sit. Nisi quis commodo aliqua dolor ex consequat consectetur Lorem ipsum deserunt quis esse minim.</P>

<H3>Fugiat adipisicing cillum nostrud deserunt cillum.</H3>
<P>Reprehenderit culpa tempor enim excepteur. Deserunt tempor velit sunt pariatur cupidatat. Ullamco anim voluptate proident excepteur consequat ea dolor ipsum dolor nulla esse. Eiusmod magna qui nostrud consectetur cillum proident dolor exercitation ut cupidatat magna. Sunt do mollit veniam aute exercitation duis non nisi dolor ea ad eu ut amet. Consectetur nulla sunt ipsum aliqua pariatur tempor laborum aliquip id ipsum nostrud. Eu excepteur commodo veniam velit duis eu.</P>

<H3>Labore enim tempor ad laboris esse dolor labore irure.</H3>
<P>Consectetur dolor occaecat cillum labore consectetur do. Eu est et incididunt voluptate ut incididunt ad do consequat. Consectetur do Lorem ullamco et minim ut enim proident fugiat esse exercitation reprehenderit in in. Commodo veniam adipisicing consectetur mollit labore anim nulla velit pariatur voluptate aliquip tempor consectetur ad. Laboris anim pariatur exercitation velit nulla quis sit duis sunt ex nostrud anim duis reprehenderit. Dolore aliqua adipisicing exercitation anim.
Pariatur sit ad laborum esse commodo veniam do fugiat aliqua in duis. Labore elit in laborum nostrud magna commodo veniam minim commodo eu et est veniam. Cillum ad nulla Lorem excepteur anim eu magna esse aute. Velit id ipsum cillum nisi incididunt aute dolore pariatur veniam laborum dolor pariatur eiusmod anim.
Aliqua occaecat sunt esse duis consequat elit ullamco ipsum elit esse enim. Do Lorem elit velit sunt veniam qui dolore tempor. Occaecat nulla esse occaecat magna veniam excepteur sint commodo Lorem pariatur sint. Elit aliqua officia tempor ea non Lorem ullamco occaecat occaecat do do voluptate. Duis deserunt officia eiusmod do sint nisi sunt veniam eu est sunt ipsum ut esse. Magna reprehenderit pariatur proident cupidatat sint veniam. Incididunt cupidatat laboris fugiat aute veniam est sint officia exercitation velit.
Aute amet culpa laboris Lorem nostrud nostrud sint cupidatat in nulla laborum. Ad do dolore ut dolor enim. Magna eu nisi veniam irure anim ex minim excepteur minim ad sint. Aliqua officia sunt labore consequat culpa labore exercitation quis qui occaecat qui. Ea sunt elit laborum commodo. Et ut fugiat do labore fugiat.
Ex eiusmod commodo magna Lorem fugiat minim et minim excepteur id aliqua nisi laboris commodo. Aliquip duis ad enim duis esse consequat nulla qui excepteur ea tempor commodo exercitation. Aute eu reprehenderit reprehenderit dolor culpa magna sint laboris fugiat consectetur. Irure magna proident est excepteur enim. Sunt quis irure cillum anim excepteur duis sit voluptate deserunt. Non ex officia ullamco aliquip amet. Est do fugiat proident quis in est ea nostrud mollit excepteur anim.
</P>

  </div>
`

export default text;